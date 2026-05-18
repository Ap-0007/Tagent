import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
    parameters: {
        backgrounds: {
            default: "dark",
            values: [
                { name: "dark", value: "#09090b" },
                { name: "light", value: "#ffffff" },
            ],
        },
        viewport: {
            viewports: {
                mobile: { name: "Mobile", styles: { width: "375px", height: "812px" } },
                tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
                desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } },
            },
        },
    },
};

export default preview;
