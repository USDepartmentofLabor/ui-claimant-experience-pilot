import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Identity, IdentityPage } from "./Identity";
import { Formik, Form } from "formik";
import { noop } from "../../../testUtils/noop";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "react-query";
import { rest } from "msw";

export default {
  title: "Pages/Identity Information",
  component: Identity,
} as ComponentMeta<typeof Identity>;

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

const Template: ComponentStory<typeof Identity> = () => {
  const { t } = useTranslation("claimForm");

  const initialValues = {
    ...IdentityPage.initialValues,
    ssn: mockWhoAmIData.ssn,
    birthdate: mockWhoAmIData.birthdate,
  };
  const validationSchema = IdentityPage.pageSchema?.(t);

  return (
    <QueryClientProvider client={new QueryClient()}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={noop}
      >
        <Form>
          <Identity />
        </Form>
      </Formik>
    </QueryClientProvider>
  );
};

export const Default = Template.bind({});
Default.parameters = {
  msw: [
    rest.get("/api/whoami/", (_req, res, ctx) => res(ctx.json(mockWhoAmIData))),
  ],
};
