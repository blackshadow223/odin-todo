import Comms from "../utils/commsHandler";
import deletePermanently from "../utils/permanentDeleter";

class ToDoItem implements ToDo {
    // Private Static Variables
    private static counter = 0;

    // Public Readonly Variables
    readonly id: number;

    // Public Variables
    title: string;
    description: string;
    dueDate: Date;
    priority: Priority;
    isComplete: boolean;

    // Constructor
    constructor(
        title: string,
        description: string,
        dueDate: Date,
        priority: Priority,
        isComplete: boolean
    ) {
        this.id = ToDoItem.counter++;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.isComplete = isComplete;
    }
}

type Projects = { [projectName: string]: ToDo[] };

class ProjectsLocalStorage {
    // Private Static Variables
    private static instance: ProjectsLocalStorage | null = null;

    // Private Variables
    private storage: Storage | null = null;
    private projects: Projects = {};

    // Constructor
    private constructor() {
        // Initialize
        try {
            const x = "__storage_test__";
            localStorage.setItem(x, x);
            localStorage.removeItem(x);
            this.storage = localStorage;
        } catch(error) {
            console.error(error);
        }

        if (this.storage) {
            const value = this.storage.getItem("projects");

            if (value) {
                this.getProjects();
            } else {
                this.runDefault();
            }
        }
    }

    // Private Methods
    private getProjects = () => {
        if (this.storage) {
            try {
                const value = this.storage.getItem("projects") as string;
                const projects = JSON.parse(value) as Projects;

                if (projects) {
                    for (const projectName in projects) {
                        Comms.emitEvent("ToDoManager.addProject", projectName);
                        const project = projects[projectName];

                        project.forEach(toDo => {
                            Comms.emitEvent(
                                "ToDoManager.addToDo",
                                {
                                    projectName: projectName,
                                    toDo: new ToDoItem(
                                        toDo.title,
                                        toDo.description,
                                        // Add dueDate as new Date, or otherwise we get a string
                                        // since Storage doesn't support storing
                                        // objects with functions, and Date objects
                                        // get converted to ISO Strings
                                        new Date(toDo.dueDate),
                                        toDo.priority,
                                        toDo.isComplete
                                    )
                                }
                            );
                        });
                    }
                }
            } catch(error) {
                this.storage.clear();
                this.runDefault();
                console.error(error);
            }
        }
    };

    private runDefault = () => {
        // Reset projects variable
        this.projects = {};

        // Add default projects and toDos
        Comms.emitEvent("ToDoManager.addProject", "Test");
        Comms.emitEvent("ToDoManager.addToDo", {
            projectName: "Test",
            toDo: new ToDoItem("Test", "Test", new Date(), "low", false),
        });
    };

    private setProjects = () => {
        this.storage?.setItem("projects", JSON.stringify(this.projects));
    };

    // Public Static Methods
    static getInstance = (): ProjectsLocalStorage => {
        if (ProjectsLocalStorage.instance) {
            return ProjectsLocalStorage.instance;
        }

        ProjectsLocalStorage.instance = new ProjectsLocalStorage();
        return ProjectsLocalStorage.instance;
    };

    static remove = (): boolean => {
        if (ProjectsLocalStorage.instance) {
            ProjectsLocalStorage.instance.storage?.removeItem("projects");

            // Permanently delete everything on the instance
            deletePermanently(ProjectsLocalStorage.instance);

            ProjectsLocalStorage.instance = null;
            return true;
        }

        return false;
    };

    // Public Methods
    getProjectNames = (): string[] => {
        const projectNames: string[] = [];

        for (const name in this.projects) {
            projectNames.push(name);
        }

        return projectNames;
    };

    getToDoListFromProject = (projectName: string): ToDo[] => {
        if (this.projects[projectName]) {
            return this.projects[projectName];
        }

        return [];
    };

    getAllToDos = (): ToDo[] => {
        const toDos: ToDo[] = [];

        for (const name in this.projects) {
            this.projects[name].forEach(toDo => toDos.push(toDo));
        }

        return toDos;
    }

    findToDo = (id: number): Promise<ToDo | undefined> => {
        return new Promise(resolve => {
            for (const name in this.projects) {
                const project = this.projects[name];
                const toDo = project.find(toDo => toDo.id === id);
                resolve(toDo);
            }
        });
    };

    addProject = (projectName: string) => {
        if (this.projects[projectName]) {
            console.warn(`Project '${projectName}' already exists`);
        } else {
            this.projects[projectName] = [];
            this.setProjects();
        }
    };

    removeProject = (projectName: string) => {
        delete this.projects[projectName];
        this.setProjects();
    };

    renameProject = (oldProjectName: string, newProjectName: string) => {
        if (this.projects[oldProjectName]) {
            let newProjects: Projects = {};

            // Go through projects one by one and add the new name in the
            // temporary 'newProjects' while keeping the all the others the same
            for (const projectName in this.projects) {
                if (projectName === oldProjectName) {
                    newProjects[newProjectName] = this.projects[oldProjectName];
                } else {
                    newProjects[projectName] = this.projects[projectName];
                }
            }

            // Replace the projects with the renamed projects
            this.projects = newProjects;

            // Update the Storage
            this.setProjects();
        } else {
            throw new ReferenceError(`Project '${oldProjectName}' not defined`);
        }
    };

    addToDo = async (projectName: string, toDo: ToDo) => {
        if (this.projects[projectName]) {
            if (await this.findToDo(toDo.id)) {
                throw new Error(`A ToDo with id '${toDo.id}' already exists`);
            }

            this.projects[projectName].push(toDo);
            this.setProjects();
        } else {
            throw new ReferenceError(`Project '${projectName}' not defined`);
        }
    };

    removeToDo = (id: number) => {
        for (let projectName in this.projects) {
            this.projects[projectName] = this.projects[projectName].filter(
                toDo => toDo.id !== id
            );
        }

        this.setProjects();
    };

    editToDo = (oldToDo: ToDo, newToDo: ToDo) => {
        for (const name in this.projects) {
            const project = this.projects[name];

            if (project.includes(oldToDo)) {
                const index = project.indexOf(oldToDo);
                project[index] = newToDo;
                break; // Don't let the loop go forward when the business is done
            }
        }

        // Update Storage
        this.setProjects();
    };

    toggleCompletion = async (id: number) => {
        const toDo = await this.findToDo(id);

        if (toDo) {
            if (toDo.isComplete === true) {
                toDo.isComplete = false;
            } else {
                toDo.isComplete = true;
            }

            this.setProjects();
        } else {
            throw new ReferenceError(`ToDo with id '${id}' doesn't exist`);
        }
    };
}

/** ToDoManager: Manages ToDos in a modular manner */
class ToDoManager {
    // Private Static Variables
    private static instance: ToDoManager | null = null;

    // Private Variables
    private projectStorage: ProjectsLocalStorage;

    // Constructor
    private constructor() {
        // Initialize
        this.projectStorage = ProjectsLocalStorage.getInstance();

        // Bind Events
        this.bindEvents();
    }

    // Private Methods
    private bindEvents = () => {
        Comms.registerResponder(
            "ToDoManager.getProjectNames",
            this.projectStorage.getProjectNames
        );
        Comms.registerResponder(
            "ToDoManager.getToDoListFromProject",
            this.projectStorage.getToDoListFromProject
        );
        Comms.registerResponder(
            "ToDoManager.getAllToDos",
            this.projectStorage.getAllToDos
        );

        Comms.addEventListener("ToDoManager.addProject", this.addProject);
        Comms.addEventListener("ToDoManager.removeProject", this.removeProject);
        Comms.addEventListener("ToDoManager.renameProject", this.renameProject);
        Comms.addEventListener("ToDoManager.addToDo", this.addToDo);
        Comms.addEventListener("ToDoManager.removeToDo", this.removeToDo);
        Comms.addEventListener("ToDoManager.editToDo", this.editToDo);
        Comms.addEventListener("ToDoManager.toggleCompletion", this.toggleCompletion);
    };

    private unbindEvents = () => {
        Comms.unregisterResponder("ToDoManager.getProjectNames");
        Comms.unregisterResponder("ToDoManager.getToDoListFromProject");
        Comms.unregisterResponder("ToDoManager.getAllToDos");

        Comms.removeEventListener("ToDoManager.addProject", this.addProject);
        Comms.removeEventListener("ToDoManager.removeProject", this.removeProject);
        Comms.removeEventListener("ToDoManager.renameProject", this.renameProject);
        Comms.removeEventListener("ToDoManager.addToDo", this.addToDo);
        Comms.removeEventListener("ToDoManager.removeToDo", this.removeToDo);
        Comms.removeEventListener("ToDoManager.editToDo", this.editToDo);
        Comms.removeEventListener("ToDoManager.toggleCompletion", this.toggleCompletion);
    };

    // Public Static Methods
    static getInstance = (): ToDoManager => {
        if (ToDoManager.instance) {
            return ToDoManager.instance;
        }

        ToDoManager.instance = new ToDoManager();
        return ToDoManager.instance;
    };

    /** Returns true if successfully removed, false otherwise */
    static remove = (): boolean => {
        if (ToDoManager.instance) {
            ToDoManager.instance.unbindEvents();
            ProjectsLocalStorage.remove();

            // Permanently delete everything on the instance
            deletePermanently(ToDoManager.instance);

            ToDoManager.instance = null;
            return true;
        }

        return false;
    };

    // Public Methods
    addProject = (projectName: string) => {
        this.projectStorage.addProject(projectName);
        Comms.emitEvent("UI.sidebar.renderProject", this.projectStorage.getProjectNames());
    };

    removeProject = (projectName: string) => {
        this.projectStorage.removeProject(projectName);
        Comms.emitEvent("UI.sidebar.renderProject", this.projectStorage.getProjectNames());
    };

    renameProject = (_arguments: { oldProjectName: string, newProjectName: string }) => {
        const oldProjectName = _arguments.oldProjectName;
        const newProjectName = _arguments.newProjectName;

        this.projectStorage.renameProject(oldProjectName, newProjectName);
        Comms.emitEvent("UI.sidebar.renderProject", this.projectStorage.getProjectNames());
    };

    addToDo = (_arguments: { projectName: string, toDo: ToDo }) => {
        const projectName = _arguments.projectName;
        const toDo = _arguments.toDo;

        this.projectStorage.addToDo(projectName, toDo);
    };

    removeToDo = (toDoId: number) => {
        this.projectStorage.removeToDo(toDoId);
    };

    editToDo = (_arguments: { oldToDo: ToDo, newToDo: ToDo }) => {
        const oldToDo = _arguments.oldToDo;
        const newToDo = _arguments.newToDo;

        this.projectStorage.editToDo(oldToDo, newToDo);
    };

    toggleCompletion = (toDoId: number) => {
        this.projectStorage.toggleCompletion(toDoId);
    };
}

export { ToDoItem };
export default ToDoManager;
