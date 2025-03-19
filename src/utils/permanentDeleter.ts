function deletePermanently(instance: {}) {
    Object.keys(instance).forEach(key => {
        // @ts-ignore
        delete instance[key];
    });
    Object.setPrototypeOf(instance, null);
}

export default deletePermanently;
