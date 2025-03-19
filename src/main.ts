import "./style.css";
import Comms from "./utils/commsHandler";
import ToDoManager from "./modules/toDoManager";
import SideBar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";
import deletePermanently from "./utils/permanentDeleter";
import ToDoDialog from "./components/ToDoDialog/ToDoDialog";
import pageChange from "./pages/pageChange";


/** The main class that handles running the entire application */
class App {
    // Private Static Variables
    private static instance: App | null = null;

    // Private Variables
    private container: HTMLDivElement;
    private activePage: HTMLElement;

    // Constructor
    private constructor(container: HTMLDivElement, activePage: HTMLElement) {
        // Initialize
        this.container = container;
        this.activePage = activePage;

        // Bind Events
        this.bindEvents();

        // Start the first page render
        Comms.emitEvent("UI.changePage", "Today");
    }

    // Private Methods
    private bindEvents = () => {
        Comms.addEventListener("UI.changePage", this.handlePageChange);
        Comms.addEventListener("UI.sidebar.toggle", this.handleSideBarToggle);
        Comms.addEventListener("UI.addToDoDialog", this.handleAddToDoDialog);
    };

    private unbindEvents = () => {
        Comms.removeEventListener("UI.sidebar.toggle", this.handleSideBarToggle);
        Comms.removeEventListener("UI.addToDoDialog", this.handleAddToDoDialog);
        Comms.removeEventListener("UI.changePage", this.handlePageChange);
    };

    private handleAddToDoDialog = async (projectName: string) => {
        const toDo = await ToDoDialog();

        if (toDo) {
            Comms.emitEvent("ToDoManager.addToDo", {
                projectName: projectName,
                toDo: toDo
            });

            // Make sure to refresh the current page so that the new ToDo
            // appears instantly
            Comms.emitEvent("UI.changePage", projectName);
        }
    }

    private handleSideBarToggle = () => {
        if (SideBar.getInstance().classList.contains("hidden")) {
            this.container.classList.add("sidebar-hidden");
        } else {
            this.container.classList.remove("sidebar-hidden");
        }
    };

    private handlePageChange = async (pageName: string) => {
        this.activePage.remove();
        this.activePage = await pageChange(pageName);
        this.container.appendChild(this.activePage);
    };

    // Public Static Methods
    /** Starts the application */
    static run = async () => {
        if (App.instance) {
            return;
        }

        ToDoManager.getInstance();

        const container = document.createElement("div");
        container.classList.add("container", "sidebar-hidden");
        document.body.appendChild(container);

        container.appendChild(Header.getInstance());
        container.appendChild(SideBar.getInstance());

        const main = await pageChange("Today");
        container.appendChild(main);

        const reset = document.createElement("button");
        reset.classList.add("reset-button");
        reset.textContent = "Reset & Reload";
        reset.onclick = () => App.close();
        container.appendChild(reset);

        App.instance = new App(container, main);
    };

    /** Closes the application */
    static close = () => {
        if (App.instance) {
            App.instance.unbindEvents();
            Header.remove();
            SideBar.remove();
            ToDoManager.remove();

            // Permanently delete everything on the instance
            deletePermanently(App.instance);

            App.instance = null;
            location.reload(); // Reload the entire current page
        }
    };
}

App.run();
