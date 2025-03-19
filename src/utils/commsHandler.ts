// Types
type RequestMap = {
    // ToDoManager
    "ToDoManager.getProjectNames": { input: null, output: string[] },
    "ToDoManager.getToDoListFromProject": { input: string, output: ToDo[] },
    "ToDoManager.getAllToDos": { input: null, output: ToDo[] },

    // UI.header
    "UI.header.getCurrentPageName": { input: null, output: string },

    // Add more requests as needed
};

type EventMap = {
    // ToDoManager
    "ToDoManager.addProject": { argument: string },
    "ToDoManager.removeProject": { argument: string },
    "ToDoManager.renameProject": { argument: { oldProjectName: string, newProjectName: string } },
    "ToDoManager.addToDo": { argument: { projectName: string, toDo: ToDo } },
    "ToDoManager.removeToDo": { argument: number },
    "ToDoManager.editToDo": { argument: { oldToDo: ToDo, newToDo: ToDo } },
    "ToDoManager.toggleCompletion": { argument: number },

    // UI
    "UI.addToDoDialog": { argument: string },
    "UI.changePage": { argument: string },
    "UI.resetPage": { argument: null },

    // UI.sidebar
    "UI.sidebar.renderProject": { argument: string[] },
    "UI.sidebar.toggle": { argument: null },


    // Add more events as needed
}

// Types for Event Listeners and Request Responders (Strongly Typed Functions)
type EventListener<Type extends keyof EventMap> = (input: EventMap[Type]["argument"]) => void;
type RequestResponder<Type extends keyof RequestMap> = (input: RequestMap[Type]["input"]) => RequestMap[Type]["output"];

// Types for Objects that contain Event Listeners and Request Responders
type EventHandlers = Partial<{ [K in keyof EventMap]: EventListener<K>[] }>;
type RequestHandlers = Partial<{ [K in keyof RequestMap]: RequestResponder<K> }>;
type PastEvents = Partial<{ [K in keyof EventMap]: EventMap[K]["argument"][] }>;


/** Comms, short for Communications. Handles communication between different modules. */
class Comms {
    // Private Static Variables
    private static eventHandlers: EventHandlers = {};
    private static requestHandlers: RequestHandlers = {};
    private static pastEvents: PastEvents = {};

    // Make sure constructor cannot be called from outside
    private constructor() {}

    // Public Static Methods
    // EVENT ENGINE
    static addEventListener = <K extends keyof EventMap>(
        eventName: K,
        eventHandler: EventListener<K>
    ) => {
        if (Comms.eventHandlers[eventName]) {
            Comms.eventHandlers[eventName].push(eventHandler);
        } else {
            // Force assign with 'any' since TypeScript complains without it
            Comms.eventHandlers[eventName] = [eventHandler] as any;
        }

        // Make sure that if there were any past events that did not have event
        // listeners, get executed with this one if it's the first event
        // listener.
        if (Comms.pastEvents[eventName]) {
            Comms.pastEvents[eventName].forEach(data => {
                eventHandler(data);
            });

            // Delete the past event once done executing
            delete Comms.pastEvents[eventName];
        }
    };

    static removeEventListener = <K extends keyof EventMap>(
        eventName: K,
        eventHandler?: EventListener<K>
    ) => {
        if (Comms.eventHandlers[eventName]) {
            if (eventHandler) {
                // Remove only the specific handler
                // Force assign with 'any' since TypeScript complains without it
                Comms.eventHandlers[eventName] = Comms.eventHandlers[eventName]
                    .filter(handler => handler !== eventHandler) as any;

                // If no eventHandlers remain, delete the key
                if (Comms.eventHandlers[eventName]?.length === 0) {
                    delete Comms.eventHandlers[eventName];
                }
            } else {
                // Delete the entire key if specific handler not specified
                delete Comms.eventHandlers[eventName];
            }
        }
    };

    static emitEvent = <K extends keyof EventMap>(
        eventName: K,
        data: EventMap[K]["argument"]
    ) => {
        if (Comms.eventHandlers[eventName]) {
            Comms.eventHandlers[eventName].forEach(handler => {
                handler(data);
            });
        } else {
            // If there is no event listeners bound for this one, then add the
            // data to past events and wait for the first event listener to be
            // added and provide the data to that listener.
            if (Comms.pastEvents[eventName]) {
                Comms.pastEvents[eventName].push(data);
            } else {
                // Force assign with 'any' since TypeScript complains without it
                Comms.pastEvents[eventName] = [data] as any;
            }
        }
    };

    // REQUEST-REPONSE ENGINE
    static registerResponder = <K extends keyof RequestMap>(
        requestName: K,
        responder: RequestResponder<K>
    ) => {
        if (Comms.requestHandlers[requestName]) {
            console.warn(`Request Type '${requestName}' already exists`);
            return;
        }

        // Force assign with 'any' since TypeScript complains without it
        Comms.requestHandlers[requestName] = responder as any;
    };

    static unregisterResponder = <K extends keyof RequestMap>(requestName: K) => {
        delete Comms.requestHandlers[requestName];
    };

    static requestResponse = <K extends keyof RequestMap>(
        requestName: K,
        data: RequestMap[K]["input"]
    ): Promise<RequestMap[K]["output"] | undefined> => {
        return new Promise(resolve => {
            if (Comms.requestHandlers[requestName]) {
                const handler = Comms.requestHandlers[requestName];
                resolve(handler(data));
            } else {
                console.warn(`No responders found for Request '${requestName}'`);
                resolve(undefined);
            }
        });
    };
}

export default Comms;
