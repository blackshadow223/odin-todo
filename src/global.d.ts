type Priority = "low" | "medium" | "high";

interface ToDo {
    // Public Readonly Variables
    readonly id: number;

    // Public Variables
    title: string;
    description: string;
    dueDate: Date;
    priority: Priority;
    isComplete: boolean;
}
