import type { StoredFuelWalletError } from '@fuel-wallet/types';
import type { InterpreterFrom, StateFrom } from 'xstate';
import { assign, createMachine } from 'xstate';
import { ErrorProcessorService } from '~/systems/Error/services/ErrorProcessorService';
import { ReportErrorService } from '../services';

export type ErrorMachineContext = {
  hasErrors?: boolean;
  errors?: StoredFuelWalletError[];
  reportErrorService: ReportErrorService;
  errorProcessorService: ErrorProcessorService;
};

type MachineServices = {
  clearErrors: {
    data: Pick<ErrorMachineContext, 'errors' | 'hasErrors'>;
  };
  reportErrors: {
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    data: void;
  };
  checkForErrors: {
    data: Pick<ErrorMachineContext, 'errors' | 'hasErrors'>;
  };
  saveError: {
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    data: void;
  };
  dismissError: {
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    data: void;
  };
};

export type ErrorMachineEvents =
  | {
      type: 'REPORT_ERRORS';
    }
  | {
      type: 'CHECK_FOR_ERRORS';
    }
  | {
      type: 'DISMISS_ERRORS';
    }
  | {
      type: 'SAVE_ERROR';
      input: Error;
    }
  | {
      type: 'DISMISS_ERROR';
      input: number;
    };

export const reportErrorMachine = createMachine(
  {
    predictableActionArguments: true,

    tsTypes: {} as import('./reportErrorMachine.typegen').Typegen0,
    schema: {
      context: {} as ErrorMachineContext,
      services: {} as MachineServices,
      events: {} as ErrorMachineEvents,
    },
    context: {
      reportErrorService: new ReportErrorService(),
      errorProcessorService: new ErrorProcessorService(),
    },
    id: '(machine)',
    initial: 'checkForErrors',
    states: {
      idle: {
        after: {
          5000: {
            target: 'checkForErrors',
          },
        },
        on: {
          DISMISS_ERRORS: {
            target: 'cleaning',
          },
          REPORT_ERRORS: {
            target: 'reporting',
          },
          CHECK_FOR_ERRORS: {
            target: 'checkForErrors',
          },
          SAVE_ERROR: {
            target: 'savingError',
          },
          DISMISS_ERROR: {
            target: 'dismissingError',
          },
        },
      },
      cleaning: {
        tags: ['loading'],
        invoke: {
          src: 'clearErrors',
          onDone: {
            target: 'idle',
          },
        },
      },
      checkForErrors: {
        invoke: {
          src: 'checkForErrors',
          onDone: [
            {
              actions: ['assignCheckForErrors'],
              target: 'idle',
            },
          ],
        },
      },
      reporting: {
        tags: ['loading'],
        invoke: {
          src: 'reportErrors',
          onDone: {
            target: 'checkForErrors',
          },
        },
      },
      savingError: {
        invoke: {
          src: 'saveError',
          onDone: {
            target: 'checkForErrors',
          },
        },
      },
      dismissingError: {
        invoke: {
          src: 'dismissError',
          onDone: {
            target: 'checkForErrors',
          },
        },
      },
    },
  },
  {
    actions: {
      assignCheckForErrors: assign({
        hasErrors: (_, ev) => ev.data.hasErrors,
        errors: (_, ev) => ev.data.errors,
      }),
    },
    services: {
      clearErrors: async (context) => {
        await context.reportErrorService.clearErrors();
        return {
          hasErrors: false,
          errors: [],
        };
      },
      reportErrors: async (context) => {
        await context.reportErrorService.reportErrors();
        await context.reportErrorService.clearErrors();
      },
      checkForErrors: async (context) => {
        const hasErrors = await context.reportErrorService.checkForErrors();
        const errors = await context.reportErrorService.getErrors();
        return {
          hasErrors,
          errors,
        };
      },
      saveError: async (_, event) => {
        await ReportErrorService.saveError(event.input);
      },
      dismissError: async (context, event) => {
        await context.reportErrorService.dismissError(event.input);
      },
    },
  }
);

export type ReportErrorMachine = typeof reportErrorMachine;
export type ReportErrorMachineState = StateFrom<ReportErrorMachine>;
export type ReportErrorMachineService = InterpreterFrom<
  typeof reportErrorMachine
>;
