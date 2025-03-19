import Comms from "../../utils/commsHandler";
import deletePermanently from "../../utils/permanentDeleter";
import confirmUI from "../ConfirmUI/ConfirmUI";

const SPECIAL_NAMES = ["Today", "This week", "Important", "All Tasks"];

function createNavListChild(textContent: string) {
    const listChild = document.createElement("li");
    listChild.classList.add("nav-link");

    const text = document.createTextNode(textContent);
    listChild.appendChild(text);

    return listChild;
}

function inputUI(insertBefore: Element, originalValue?: string): Promise<string> {
    return new Promise(resolve => {
        // Initialize
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 25;
        input.classList.add("add-project-input");
        input.placeholder = "Project Name";

        if (originalValue) {
            input.value = originalValue;
        }

        insertBefore.insertAdjacentElement("beforebegin", input);
        insertBefore.remove(); // Temporarily remove element
        input.focus();

        // Function to handle input event
        input.onkeydown = async (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                // Remove the input and reinstate the original element
                input.insertAdjacentElement("beforebegin", insertBefore);
                input.remove();
            } else if (event.key === "Enter") {
                const inputValue = input.value.trim();

                // If the value is still the same then just escape
                if (originalValue === inputValue) {
                    input.insertAdjacentElement("beforebegin", insertBefore);
                    input.remove();
                } else {
                    // Make sure the (supposedly) new value doesn't already exist
                    const projectNames = await Comms.requestResponse("ToDoManager.getProjectNames", null);

                    // Also make sure the field isn't empty either
                    if (projectNames?.includes(inputValue) || inputValue.length === 0 || SPECIAL_NAMES.includes(inputValue)) {
                        return; // Just don't do anything if this is the case for now
                    }

                    // Remove the input and restore the original element
                    input.insertAdjacentElement("beforebegin", insertBefore);
                    input.remove();

                    // Resolve and return this value if it matches the conditions
                    resolve(inputValue);
                }
            }
        };
    });
}

class SideBar {
    // Private Static Variables
    private static instance: SideBar | null = null;

    // Private Variables
    private nav: HTMLElement;
    private projectSideNavList: HTMLUListElement;
    private addProjectButton: HTMLButtonElement;

    // Constructor
    private constructor(
        nav: HTMLElement,
        projectSideNavList: HTMLUListElement,
        addProjectButton: HTMLButtonElement
    ) {
        // Cache DOM
        this.nav = nav;
        this.projectSideNavList = projectSideNavList;
        this.addProjectButton = addProjectButton;

        // Bind Events
        this.bindEvents();
    }

    // Private Methods
    private bindEvents = () => {
        this.nav.addEventListener("click", this.handleNavEvent);

        Comms.addEventListener("UI.sidebar.renderProject", this.handleRenderProjects);
        Comms.addEventListener("UI.changePage", this.handlePageChange);
        Comms.addEventListener("UI.resetPage", this.handleResetPage);
        Comms.addEventListener("UI.sidebar.toggle", this.handleSideBarToggle);
    };

    private unbindEvents = () => {
        this.nav.removeEventListener("click", this.handleNavEvent);

        Comms.removeEventListener("UI.sidebar.renderProject", this.handleRenderProjects);
        Comms.removeEventListener("UI.changePage", this.handlePageChange);
        Comms.removeEventListener("UI.resetPage", this.handleResetPage);
        Comms.removeEventListener("UI.sidebar.toggle", this.handleSideBarToggle);
    };

    // HTML Event Handlers
    private handleNavEvent = (event: MouseEvent) => {
        if (event.target instanceof HTMLElement) {
            if (event.target.classList.contains("add-project-button")) {
                this.handleAddEvent();
            } else if (event.target.classList.contains("nav-delete")) {
                this.handleRemoveEvent(event);
            } else if (event.target.classList.contains("nav-edit")) {
                this.handleEditEvent(event);
            } else if (event.target.classList.contains("nav-link")) {
                this.handlePageChangeEvent(event);
            }
        }
    };

    private handleAddEvent = async () => {
        Comms.emitEvent("ToDoManager.addProject", await inputUI(this.addProjectButton));
    };

    private handleRemoveEvent = async (event: MouseEvent) => {
        if (event.target instanceof HTMLButtonElement) {
            const value = event.target.closest("li")?.childNodes.item(0).textContent;

            if (value) {
                const confirmation = await confirmUI("Are you sure you want to delete this project?");

                if (confirmation) {
                    // Notify ToDoManager to remove project
                    Comms.emitEvent("ToDoManager.removeProject", value);
                }
            }
        }
    };

    private handleEditEvent = async (event: MouseEvent) => {
        if (event.target instanceof HTMLButtonElement) {
            // Target Link
            const target = event.target.closest("li") as HTMLLIElement;

            // Original Value
            const originalValue = target.childNodes.item(0).textContent;

            // Input Value
            let inputValue = await inputUI(target, originalValue!);

            // If the values exist then commence operation
            if (originalValue && inputValue) {
                Comms.emitEvent("ToDoManager.renameProject", {
                    oldProjectName: originalValue,
                    newProjectName: inputValue
                });
            }
        }
    };

    private handlePageChangeEvent = (event: MouseEvent) => {
        if (event.target instanceof HTMLLIElement) {
            const value = event.target.childNodes.item(0).textContent;
            if (value) {
                // Notify All UI that page change should occur
                Comms.emitEvent("UI.changePage", value);
            }
        }
    };

    // Application Event Handlers
    private handleRenderProjects = (projectNames: string[]) => {
        // Name of the project that might be active
        const activeName = this.projectSideNavList
                            .querySelector<HTMLLIElement>(".nav-link.active")
                            ?.childNodes.item(0).textContent;
        this.projectSideNavList.textContent = ""; // Remove everything


        projectNames.forEach(name => {
            const projectChild = createNavListChild(name);

            if (activeName === name) {
                projectChild.classList.add("active");
            }

            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("nav-buttons-group");
            projectChild.appendChild(buttonContainer);


            const editButton = document.createElement("button");
            editButton.classList.add("nav-edit", "material-symbols-outlined");
            editButton.textContent = "edit";
            buttonContainer.appendChild(editButton);

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("nav-delete", "material-symbols-outlined");
            deleteButton.textContent = "delete";
            buttonContainer.appendChild(deleteButton);

            this.projectSideNavList.appendChild(projectChild);
        });
    };

    private handlePageChange = (pageName: string) => {
        const navs = Array.from(this.nav.querySelectorAll(".nav-link"));
        const target = navs.find(element => element.childNodes.item(0).textContent === pageName);

        const active = this.nav.querySelector<HTMLLIElement>(".active");
        active?.classList.remove("active");
        target?.classList.add("active");
    };

    private handleResetPage = () => {
        // Change active link
        const active = this.nav.querySelector<HTMLLIElement>(".active");
        active?.classList.remove("active");

        const target = this.nav.querySelector("li");
        target?.classList.add("active");
        const value = target?.childNodes.item(0).textContent;

        if (value) {
            // Notify All UI that page change should occur
            Comms.emitEvent("UI.changePage", value);
        }
    };

    private handleSideBarToggle = () => {
        this.nav.classList.toggle("hidden");
    };

    // Public Static Methods
    static getInstance = (): HTMLElement => {
        if (SideBar.instance) {
            return SideBar.instance.nav;
        }

        // Wrapper nav
        const nav = document.createElement("nav");
        nav.classList.add("sidebar");

        // Home Div
        const homeDiv = document.createElement("div");
        homeDiv.classList.add("side");
        nav.appendChild(homeDiv);

        // Home Div Children
        // Heading
        const homeHeading = document.createElement("h2");
        homeHeading.textContent = "Home";
        homeDiv.appendChild(homeHeading);

        // Nav List
        const homeNavList = document.createElement("ul");
        homeNavList.classList.add("nav");
        homeDiv.appendChild(homeNavList);

        homeNavList.appendChild(createNavListChild("Today"));
        homeNavList.appendChild(createNavListChild("This week"));
        homeNavList.appendChild(createNavListChild("Important"));
        homeNavList.appendChild(createNavListChild("All Tasks"));

        // Projects Div
        const projectsDiv = document.createElement("div");
        projectsDiv.classList.add("side");
        nav.appendChild(projectsDiv);

        // Projects Div Children
        // Heading
        const projectHeading = document.createElement("h2");
        projectHeading.textContent = "Projects";
        projectsDiv.appendChild(projectHeading);

        // Nav List
        const projectNavList = document.createElement("ul");
        projectNavList.classList.add("nav");
        projectsDiv.appendChild(projectNavList);

        // Add Project Button
        const addProjectButton = document.createElement("button");
        addProjectButton.classList.add("add-project-button", "material-symbols-outlined");
        // addProjectButton.textContent = "+";
        addProjectButton.textContent = "add";
        projectsDiv.appendChild(addProjectButton);


        // Create a new instance
        SideBar.instance = new SideBar(
            nav,
            projectNavList,
            addProjectButton
        );

        // Keep the sidebar hidden by default
        Comms.emitEvent("UI.sidebar.toggle", null);

        // Return the nav
        return SideBar.instance.nav;
    };

    /** Returns true if successfully removed, false otherwise */
    static remove = (): boolean => {
        if (SideBar.instance) {
            SideBar.instance.nav.remove();
            SideBar.instance.unbindEvents();

            // Permanetly delete everything on the instance
            deletePermanently(SideBar.instance);

            SideBar.instance = null;
            return true;
        }

        return false;
    };
}

export { SPECIAL_NAMES };
export default SideBar;
