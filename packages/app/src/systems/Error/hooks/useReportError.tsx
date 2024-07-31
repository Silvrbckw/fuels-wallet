import { Services, store } from '~/store';
import type { ReportErrorMachineState } from '../machines';

const selectors = {
  hasErrorsToReport(state: ReportErrorMachineState) {
    return state.context.hasErrors;
  },
  isLoadingSendOnce(state: ReportErrorMachineState) {
    return state.hasTag('loading');
  },
  errors(state: ReportErrorMachineState) {
    return state.context?.errors || [];
  },
};

export function useReportError() {
  const hasErrorsToReport = store.useSelector(
    Services.reportError,
    selectors.hasErrorsToReport
  );
  const isLoadingSendOnce = store.useSelector(
    Services.reportError,
    selectors.isLoadingSendOnce
  );
  const errors = store.useSelector(Services.reportError, selectors.errors);

  const reportErrors = () => {
    store.send(Services.reportError, { type: 'REPORT_ERRORS' });
  };

  const ignoreErrors = () => {
    store.send(Services.reportError, { type: 'IGNORE_ERRORS' });
  };

  const dismissError = (index: number) => {
    store.send(Services.reportError, { type: 'DISMISS_ERROR', input: index });
  };

  const close = () => {
    ignoreErrors();
  };

  return {
    hasErrorsToReport,
    isLoadingSendOnce,
    errors,
    handlers: {
      reportErrors,
      ignoreErrors,
      close,
      dismissError,
    },
  };
}
