import { ComponentMeta, ComponentStory } from "@storybook/react";
import HelpText from "./HelpText";

export default {
  title: "Components/HelpText",
  component: HelpText,
} as ComponentMeta<typeof HelpText>;

const Template: ComponentStory<typeof HelpText> = (args) => {
  return (
    <div className="width-mobile">
      <HelpText withLeftBorder={args.withLeftBorder}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam tempor
        porta massa, vitae auctor tortor. Nunc rhoncus volutpat nulla, eget
        sagittis tellus facilisis eget. Nam ut egestas eros. Aenean euismod, sem
        eleifend malesuada convallis, lacus dui condimentum odio, eu gravida
        nisi massa quis libero. Integer sit amet felis purus. Maecenas nulla
        lorem, congue nec neque eu, varius iaculis velit. Morbi eu aliquet nibh.
        Mauris scelerisque, ante vitae accumsan posuere, urna velit laoreet
        velit, vel placerat tellus dui in purus. Etiam non fermentum diam.
        Suspendisse in urna pellentesque, convallis lacus id, dapibus magna.
      </HelpText>
    </div>
  );
};

export const Default = Template.bind({});

export const WithLeftBorder = Template.bind({});
WithLeftBorder.args = {
  withLeftBorder: true,
};
