import React from 'react';
import PropTypes from 'prop-types';

const WhoAmIPage = (props) => {
  const { whoami } = props;

  return (
    <section>
      <h1>Who am I</h1>

      <p className="usa-intro">Displays the account attributes from the AAL2/IAL2 session</p>

      <ul className="usa-list">
        <li>
          Form ID: {whoami.form_id}
        </li>
        <li>
          First Name: {whoami.first_name}
        </li>
        <li>
          Last Name: {whoami.last_name}
        </li>
        <li>
          Birthdate: {whoami.birthdate}
        </li>
      </ul>
    </section>
  );
};

export default WhoAmIPage;

WhoAmIPage.propTypes = {
  whoami: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};
