import React from "react";
import { RequestWrapper } from "../queries/RequestWrapper";
import { useWhoAmI } from "../queries/whoami";

const WhoAmI = () => {
  const { data: whoami } = useWhoAmI();

  if (!whoami) {
    return <></>;
  }

  return (
    <ul className="usa-list">
      <li>Form ID: {whoami.form_id}</li>
      <li>First Name: {whoami.first_name}</li>
      <li>Last Name: {whoami.last_name}</li>
      <li>Birthdate: {whoami.birthdate}</li>
      <li>Email: {whoami.email}</li>
      <li>SSN: {whoami.ssn}</li>
      <li>Phone: {whoami.phone}</li>
    </ul>
  );
};

const WhoAmIPage = () => {
  return (
    <main>
      <h1>Who am I</h1>
      <p className="usa-intro">
        Displays the account attributes from the AAL2/IAL2 session
      </p>
      <RequestWrapper>
        <WhoAmI />
      </RequestWrapper>
    </main>
  );
};

export default WhoAmIPage;
