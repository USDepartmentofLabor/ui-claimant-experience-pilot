import { VerifiedFields } from "./VerifiedFields";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { rest } from "msw";
import { QueryClient, QueryClientProvider } from "react-query";

export default {
  title: "Components/Form/VerifiedFields",
  component: VerifiedFields,
} as ComponentMeta<typeof VerifiedFields>;

const mockWhoAmIData = {
  IAL: "2",
  claim_id: "123",
  claimant_id: "321",
  first_name: "Hermione",
  last_name: "Granger",
  birthdate: "2000-12-22",
  ssn: "555-55-5555",
  email: "test@example.com",
  phone: "555-555-5555",
  address: {
    address1: "123 Main St",
    city: "Anywhere",
    state: "KS",
    zipcode: "00000",
  },
  swa: {
    code: "MD",
    name: "Maryland",
    claimant_url: "https://some-test-url.gov",
    featureset: "Claim And Identity",
  },
  identity_provider: "Local",
};

const Template: ComponentStory<typeof VerifiedFields> = (args) => (
  <QueryClientProvider client={new QueryClient()}>
    <VerifiedFields fields={args.fields} />
  </QueryClientProvider>
);

export const Default = Template.bind({});
Default.parameters = {
  msw: [
    rest.get("/api/whoami/", (_req, res, ctx) => res(ctx.json(mockWhoAmIData))),
  ],
};

Default.args = {
  fields: [
    "first_name",
    "last_name",
    "birthdate",
    "ssn",
    "email",
    "phone",
    "address",
  ],
};
