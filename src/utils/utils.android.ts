import * as nsApp from 'tns-core-modules/application';
import * as utils from 'tns-core-modules/utils/utils';
import { isTraceEnabled, writeTrace } from '../trace';

export * from 'tns-core-modules/utils/utils';

let lastIsAccessibilityServiceEnabled: boolean;
export function isAccessibilityServiceEnabled(forceUpdate = false): boolean {
  const cls = `isAccessibilityServiceEnabled<android>()`;

  if (!forceUpdate && lastIsAccessibilityServiceEnabled !== undefined) {
    if (isTraceEnabled()) {
      writeTrace(`${cls}: reuse - isEnabled:${lastIsAccessibilityServiceEnabled}`);
    }
    return lastIsAccessibilityServiceEnabled;
  }

  const context = utils.ad.getApplicationContext() as android.content.Context;
  if (!context) {
    if (isTraceEnabled()) {
      writeTrace(`${cls}: no context`);
    }
    return false;
  }

  const a11yManager = context.getSystemService(android.content.Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager;
  if (!a11yManager) {
    if (isTraceEnabled()) {
      writeTrace(`${cls}: no a11yService`);
    }
    lastIsAccessibilityServiceEnabled = false;
    return false;
  }

  const isEnabled = android.support.v4.view.accessibility.AccessibilityManagerCompat.isTouchExplorationEnabled(a11yManager);

  if (isTraceEnabled()) {
    writeTrace(`${cls}: isEnabled:${isEnabled}`);
  }

  lastIsAccessibilityServiceEnabled = isEnabled;

  return isEnabled;
}

nsApp.on(nsApp.resumeEvent, () => isAccessibilityServiceEnabled(true));
