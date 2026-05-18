import type { Meta, StoryObj } from "@storybook/react";
import { Nav } from "./Nav";

const meta: Meta<typeof Nav> = {
    title: "Layout/Nav",
    component: Nav,
    parameters: {
        layout: "fullscreen",
        nextjs: { appDirectory: true },
    },
};

export default meta;
type Story = StoryObj<typeof Nav>;

export const Default: Story = {};
