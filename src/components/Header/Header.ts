import Comms from "../../utils/commsHandler";
import deletePermanently from "../../utils/permanentDeleter";

class Header {
    // Private Static Variables
    private static instance: Header | null = null;

    // Private Variables
    private header: HTMLElement;
    private hamburger: HTMLButtonElement;
    private heading: HTMLHeadingElement;
    private button: HTMLButtonElement;

    // Constructor
    private constructor(
        header: HTMLElement,
        hamburger: HTMLButtonElement,
        heading: HTMLHeadingElement,
        button: HTMLButtonElement
    ) {
        // Cache DOM
        this.header = header;
        this.hamburger = hamburger;
        this.heading = heading;
        this.button = button;

        // Bind Events
        this.bindEvents();
    }

    // Private Methods
    private bindEvents = () => {
        Comms.registerResponder("UI.header.getCurrentPageName", this.getCurrentPageName);

        this.header.addEventListener("click", this.handleHeaderEvent);

        Comms.addEventListener("UI.changePage", this.handlePageChange);
        Comms.addEventListener("ToDoManager.removeProject", this.handleProjectRemoval);
    };

    private unbindEvents = () => {
        Comms.unregisterResponder("UI.header.getCurrentPageName");

        this.header.removeEventListener("click", this.handleHeaderEvent);

        Comms.removeEventListener("UI.changePage", this.handlePageChange);
        Comms.removeEventListener('ToDoManager.removeProject', this.handleProjectRemoval);
    };

    private getCurrentPageName = (): string => {
        return this.heading.textContent as string;
    };

    private handleHeaderEvent = (event: MouseEvent) => {
        if (event.target === this.button || event.target === this.button.querySelector("span")) {
            this.handleButtonEvent();
        } else if (event.target === this.hamburger) {
            this.handleHamburgerEvent();
        }
    };

    private handleButtonEvent = () => {
        const projectName = this.heading.textContent;

        if (projectName) {
            Comms.emitEvent("UI.addToDoDialog", projectName);
        }
    };

    private handleHamburgerEvent = () => {
        Comms.emitEvent("UI.sidebar.toggle", null);

        if (this.hamburger.textContent === "menu") {
            this.hamburger.textContent = "close";
        } else {
            this.hamburger.textContent = "menu";
        }
    };

    private handlePageChange = async (name: string) => {
        this.heading.textContent = name;

        const names = await Comms.requestResponse(
            "ToDoManager.getProjectNames",
            null
        );

        if (names?.includes(name)) {
            this.button.style.visibility = "visible";
        } else {
            this.button.style.visibility = "hidden";
        }
    };

    private handleProjectRemoval = (name: string) => {
        if (this.heading.textContent === name) {
            Comms.emitEvent("UI.resetPage", null);
        }
    };

    // Public Static Methods
    static getInstance = (): HTMLElement => {
        if (Header.instance) {
            return Header.instance.header;
        }

        // Header
        const header = document.createElement("header");
        header.classList.add("header");

        // Div to hold hamburger and heading
        const holder = document.createElement("div");
        holder.classList.add("header-separator");
        header.appendChild(holder);

        // Hamburger
        const hamburger = document.createElement("button");
        hamburger.classList.add("hamburger", "material-symbols-outlined");
        // hamburger.textContent = String.fromCharCode(9776);
        hamburger.textContent = "menu";
        holder.appendChild(hamburger);

        // Heading
        const heading = document.createElement("h2");
        holder.appendChild(heading);

        // Create button
        const button = document.createElement("button");
        button.classList.add("header-add-button");

        const span = document.createElement("span");
        span.classList.add("material-symbols-outlined");
        // span.textContent = "+";
        span.textContent = "add";
        button.appendChild(span);
        button.appendChild(document.createTextNode("Create"));

        // button.style.display = "none";
        button.style.visibility = "hidden";
        header.appendChild(button);


        // Create a new instance and return the header
        Header.instance = new Header(header, hamburger, heading, button);
        return Header.instance.header;
    };

    /** Returns true if successfully removed, false otherwise */
    static remove = (): boolean => {
        if (Header.instance) {
            Header.instance.header.remove();
            Header.instance.unbindEvents();

            // Permanently delete everything on the instance
            deletePermanently(Header.instance);

            Header.instance = null;
            return true;
        }

        return false;
    };
}

export default Header;
