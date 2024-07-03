"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formMachine = void 0;
const xstate_1 = require("xstate");
exports.formMachine = (0, xstate_1.setup)({
    types: {
        context: {},
        input: {},
        events: {}
    },
    actions: {
        saveUserInfo: (0, xstate_1.assign)(({ context, event }) => {
            if (event.type !== 'SAVE.USER') {
                return context;
            }
            return Object.assign(Object.assign({}, context), { firstName: event.data.firstName, lastName: event.data.lastName, dateOfBirth: event.data.dateOfBirth });
        }),
        saveAccountInfo: (0, xstate_1.assign)(({ context, event }) => {
            if (event.type !== 'SAVE.ACCOUNT') {
                return context;
            }
            return Object.assign(Object.assign({}, context), { username: event.data.username, email: event.data.email });
        }),
        resetContext: (0, xstate_1.assign)(() => {
            return {
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                email: '',
                username: ''
            };
        }),
        showErrorMessage: () => alert('An error occurred. Please try again.'),
        showUsernameError: () => alert('Username is already taken. Please try a different username.'),
    },
    actors: {
        submitUserAccountInfo: (0, xstate_1.fromPromise)((_a) => __awaiter(void 0, [_a], void 0, function* ({ input }) {
            console.log('Submitting user account details', Object.assign({}, input));
            const randomBit = Math.floor(Math.random() * 2);
            return randomBit === 0 ? yield Promise.reject() : yield Promise.resolve();
        })),
        checkUsernameAvailability: (0, xstate_1.fromPromise)((_a) => __awaiter(void 0, [_a], void 0, function* ({ input }) {
            console.log('Checking username availability', input.username);
            if (input.username.toLowerCase() === 'thesilverhand') {
                return yield Promise.reject();
            }
            return yield Promise.resolve();
        })),
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
                input: ({ context }) => ({ username: context.username }),
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
                input: ({ context }) => ({
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
