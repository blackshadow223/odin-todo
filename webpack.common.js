import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
    entry: "./src/index.js",
    output: {
        filename: "app.js",
        path: path.resolve("./dist"),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/template.html",
        }),
    ],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
                type: "asset/resource",
            },
        ],
    },
};
