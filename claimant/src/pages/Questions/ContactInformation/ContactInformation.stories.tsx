import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import { useTranslation } from "react-i18next";
import { noop } from "../../../testUtils/noop";
import {
  ContactInformation,
  ContactInformationPage,
} from "./ContactInformation";
import { rest } from "msw";
import { QueryClient, QueryClientProvider } from "react-query";

export default {
  title: "Pages/Contact Information",
  component: ContactInformation,
} as ComponentMeta<typeof ContactInformation>;

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

const Template: ComponentStory<typeof ContactInformation> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = ContactInformationPage.pageSchema(t);
  const initialValues = {
    phones: [{ number: mockWhoAmIData.phone }],
    email_address: mockWhoAmIData.email,
    interpreter_required: undefined,
    preferred_language: "",
  };

  return (
    <QueryClientProvider client={new QueryClient()}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={noop}
      >
        <Form>
          <ContactInformation />
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
