# Design System

- Status: Decided
- Deciders: Team consensus, including designers
- Date: 2021-10-01

The application requires a design system to define the color palette, user interface components, and other user affordances. A design system provides predictability in the user interface and ensures that Section 508 issues such as color contrast are considered.

## Considered Alternatives

- Material-UI, the most popular option at [this page](https://openbase.com/categories/js/best-react-design-system-libraries).
- US Web Design System

## Pros and Cons of the Alternatives

### Material-UI

- `+` Widely used for React development
- `+` Large selection of components available
- `-` Not commonly used by government web sites

### US Web Design System

- `+` Used by DOL Drupal, and React app at https://flag.dol.gov
- `+` This team's engineers and designers are familiar with USWDS
- `+` Mandated for federal websites by the [21st Century IDEA Act](https://digital.gov/resources/21st-century-integrated-digital-experience-act/)
- `-` USWDS components are not as mature or complete as Material-UI

## Decision Outcome

Use the US Web Design system.
