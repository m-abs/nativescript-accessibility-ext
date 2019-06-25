import * as nsApp from 'tns-core-modules/application';
import { Observable, PropertyChangeData } from 'tns-core-modules/data/observable';
import { isTraceEnabled, writeFontScaleTrace } from '../trace';

function getClosestValidFontScale(fontScale: number) {
  return FontScaleObservable.VALID_FONT_SCALES.sort((a, b) => Math.abs(fontScale - a) - Math.abs(fontScale - b)).shift();
}

let internalObservable: Observable;
function fontScaleChanged(fontScale: number) {
  const cls = `fontScaleChanged(${fontScale})`;

  if (isTraceEnabled()) {
    writeFontScaleTrace(`${cls}`);
  }

  fontScale = getClosestValidFontScale(fontScale);

  if (isTraceEnabled()) {
    writeFontScaleTrace(`${cls} - settings closest valid value: ${fontScale}`);
  }

  internalObservable.set(FontScaleObservable.FONT_SCALE, fontScale);
}

function useAndroidFontScale() {
  fontScaleChanged(Number(nsApp.android.context.getResources().getConfiguration().fontScale));
}

function setupConfigListener() {
  nsApp.off(nsApp.launchEvent, setupConfigListener);

  const context = nsApp.android && (nsApp.android.context as android.content.Context);

  if (!context) {
    nsApp.on(nsApp.launchEvent, setupConfigListener);
    return;
  }

  useAndroidFontScale();

  let configChangedCallback = new android.content.ComponentCallbacks2({
    onLowMemory() {
      // Dummy
    },
    onTrimMemory() {
      // Dummy
    },
    onConfigurationChanged(newConfig: android.content.res.Configuration) {
      fontScaleChanged(Number(newConfig.fontScale));
    },
  });

  context.registerComponentCallbacks(configChangedCallback);

  nsApp.on(nsApp.resumeEvent, useAndroidFontScale);
}

function ensureObservable() {
  if (internalObservable) {
    return;
  }

  internalObservable = new Observable();
  setupConfigListener();
}

export class FontScaleObservable extends Observable {
  public static readonly FONT_SCALE = 'fontScale';
  public static get VALID_FONT_SCALES() {
    return [0.85, 1, 1.15, 1.3];
  }

  constructor() {
    super();

    ensureObservable();

    const selfRef = new WeakRef(this);

    function callback(args: PropertyChangeData) {
      const self = selfRef.get();
      if (self) {
        self.set(args.propertyName, args.value);
        return;
      }

      internalObservable.off(Observable.propertyChangeEvent, callback);
    }

    internalObservable.on(Observable.propertyChangeEvent, callback);
    this.set(FontScaleObservable.FONT_SCALE, internalObservable.get(FontScaleObservable.FONT_SCALE));
  }
}
