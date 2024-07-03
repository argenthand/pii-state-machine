import {type Actor, assign, fromPromise, setup, type SnapshotFrom} from "xstate";
import {useSelector} from "@xstate/react";

export const formMachine = setup({
  types: {
    context: {} as {
      firstName: string,
      lastName: string,
      dateOfBirth: string,
      username: string,
      email: string
    },
    input: {} as {
      firstName: string,
      lastName: string,
      dateOfBirth: string,
      username: string,
      email: string,
    },
    events: {} as
      | { type: 'START' }
      | { type: 'BACK' }
      | { type: 'RESET' }
      | {
      type: 'SAVE.USER', data: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
      }
    }
      | {
      type: 'SAVE.ACCOUNT', data: {
        username: string;
        email: string;
      }
    }
      | { type: 'RETRY' }
  },
  actions: {
    saveUserInfo: assign(({context, event}) => {
      if (event.type !== 'SAVE.USER') {
        return context;
      }
      return {
        ...context,
        firstName: event.data.firstName,
        lastName: event.data.lastName,
        dateOfBirth: event.data.dateOfBirth,
      };
    }),
    saveAccountInfo: assign(({context, event}) => {
      if (event.type !== 'SAVE.ACCOUNT') {
        return context;
      }
      return {
        ...context,
        username: event.data.username,
        email: event.data.email
      }
    }),
    resetContext: assign(() => {
      return {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        email: '',
        username: ''
      }
    }),
    showErrorMessage: () => alert('An error occurred. Please try again.'),
    showUsernameError: () => alert('Username is already taken. Please try a different username.'),
  },
  actors: {
    submitUserAccountInfo: fromPromise(async ({input}) => {
      console.log('Submitting user account details', {...input});
      const randomBit = Math.floor(Math.random() * 2);
      return randomBit === 0 ? await Promise.reject() : await Promise.resolve();
    }),
    checkUsernameAvailability: fromPromise(async ({input}: { input: { username: string; } }) => {
      console.log('Checking username availability', input.username);
      if (input.username.toLowerCase() === 'thesilverhand') {
        return await Promise.reject();
      }
      return await Promise.resolve();
    }),
  }
}).createMachine({
  id: 'form-machine',
  initial: 'idle',
  context: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    username: ''
  },
  states: {
    'idle': {
      on: {
        START: {
          target: 'capturing-account-info'
        }
      }
    },
    'capturing-user-info': {
      on: {
        'SAVE.USER': {
          actions: ['saveUserInfo'],
          target: 'submitting',
        },
        'BACK': {
          target: 'capturing-account-info'
        }
      }
    },
    'capturing-account-info': {
      on: {
        'SAVE.ACCOUNT': {
          actions: ['saveAccountInfo'],
          target: 'checking-username-availability'
        },
        'RESET': {
          target: 'idle',
          actions: ['resetContext']
        }
      }
    },
    'checking-username-availability': {
      invoke: {
        id: 'checking-username-availability',
        src: 'checkUsernameAvailability',
        input: ({context}) => ({username: context.username}),
        onDone: {
          target: 'capturing-user-info'
        },
        onError: {
          actions: ['showUsernameError'],
          target: 'capturing-account-info'
        }
      }
    },
    'submitting': {
      invoke: {
        id: 'submitting-user-account-info',
        src: 'submitUserAccountInfo',
        input: ({context}) => ({
          userDetails: {
            name: `${context.firstName} ${context.lastName}`,
            dateOfBirth: context.dateOfBirth
          },
          accountDetails: {
            username: context.username,
            email: context.email
          }
        }),
        onDone: {
          target: 'complete',
          actions: ['resetContext']
        },
        onError: {
          actions: ['showErrorMessage'],
          target: 'error'
        }
      }
    },
    'error': {
      on: {
        RETRY: {
          target: 'capturing-user-info'
        }
      }
    },
    'complete': {
      type: 'final'
    }
  }
});

export type Snapshot = SnapshotFrom<typeof formMachine>;
export type FormMachineActor = Actor<typeof formMachine>;

const selectFirstName = (snapshot: Snapshot) => snapshot.context.firstName;
const selectLastName = (snapshot: Snapshot) => snapshot.context.lastName;
const selectDateOfBirth = (snapshot: Snapshot) => snapshot.context.dateOfBirth;
const selectUsername = (snapshot: Snapshot) => snapshot.context.username;
const selectEmail = (snapshot: Snapshot) => snapshot.context.email;

export function useMachineContext(actorRef: FormMachineActor) {
  const firstName = useSelector(actorRef, selectFirstName);
  const lastName = useSelector(actorRef, selectLastName);
  const dateOfBirth = useSelector(actorRef, selectDateOfBirth);
  const username = useSelector(actorRef, selectUsername);
  const email = useSelector(actorRef, selectEmail);

  return {firstName, lastName, dateOfBirth, username, email};
}

const idle = (snapshot: Snapshot) => snapshot.matches('idle');
const capturingUserInfo = (snapshot: Snapshot) => snapshot.matches('capturing-user-info');
const capturingAccountInfo = (snapshot: Snapshot) => snapshot.matches('capturing-account-info');
const complete = (snapshot: Snapshot) => snapshot.matches('complete');
const error = (snapshot: Snapshot) => snapshot.matches('error');
const submitting = (snapshot: Snapshot) => snapshot.matches('submitting');

export function useMachineState(actorRef: FormMachineActor) {
  const isIdle = useSelector(actorRef, idle);
  const isCapturingUserInfo = useSelector(actorRef, capturingUserInfo);
  const isCapturingAccountInfo = useSelector(actorRef, capturingAccountInfo);
  const isComplete = useSelector(actorRef, complete);
  const isError = useSelector(actorRef, error);
  const isSubmitting = useSelector(actorRef, submitting);

  return {isIdle, isCapturingUserInfo, isCapturingAccountInfo, isComplete, isError, isSubmitting};
}
