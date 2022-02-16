<!-- prettier-ignore -->
# Accessibility Testing Process

The below steps are specifically the accessibility testing part of the overall acceptance flow process.

The code submitter, code reviewer, and design reviewer should go through each of the steps below for any user interface changes. Although there are several steps, if we keep up and do them with each PR, it will be a light lift, and will avoid any a11y debt. Ideally we are testing in different browsers. Given that we must use a VPN on a GFE to access a deployed environment, only whitelisted IP addresses will be able to test on actual mobile devices.

## For each user interface PR:

- [ ] Check **responsiveness**: mobile, tablet and desktop. Use a browser you don’t normally develop in (Firefox, Safari, or Chrome/Edge)

  - Use the browser dev tools to set up device sizes.
  - When accessed on phone, tablet, or desktop sizes, content is resized and organized reasonably such that it is viewable and readable

- [ ] Check that it’s **keyboard navigable**

  - all functionality available by mouse is also available by keyboard
  - If focus can be moved to a part of the content, it can also be moved away
  - navigate using tab, tab+shift, arrow keys, and enter
  - Inputs should use constraints (e.g. `type`, `inputmode`, `maxlength`, or JS-based where more appropriate/maintainable) as often as possible to avoid relying on validation error messages
  - Before the first form submit (clicking "Next" button), there is no per-field "onblur" validation. On submit ("Next" click), validate the entire form. If there are any errors, show validation summary and announce via `role=alert`, and set focus on first input with an error. After that, validation occurs on per-field focus change.
  - Both "Back" button and "Save and exit" link are navigation only and do not trigger any validation.

- [ ] Check the VoiceOver **rotary menu** ([instructions](https://github.com/trussworks/accessibility/blob/master/README.md#how-to-use-the-rotor-menu)):

  For each of the following rotor lists, use the keyboard to go through the list and check that focus moves to that element.

  - **Landmarks**

    Check to make sure that all the standard regions are showing correctly e.g. header, footer, main etc.
    If you have custom regions such as landmark for search or sidebar, then make sure those names show up correctly.

  - **Page heading structure**

    Make sure there’s only one h1 on the page. Check that the hierarchy is going from h1 to h6 and no heading levels are skipped.

  - **Links**

    Check that all the intended links on the page are displayed in this menu with the right link label.

- [ ] Use **[VoiceOver](https://dequeuniversity.com/screenreaders/voiceover-keyboard-shortcuts) screen reader** (with Safari) to walk through the interface changes

  - Listen to make sure context makes sense semantically
  - Make sure actions (like buttons) have enough verbal context to understand what they do
  - Check that transitions make sense and focus goes where expected (ex. new page)
  - Ensure users are brought to errors so they know what is wrong

- [ ] Open one of these three **a11y browser tools** to check for errors or issues: [WAVE](https://wave.webaim.org/), [axe](https://www.deque.com/axe/devtools/) (free version is sufficient, for Chrome only), or [ANDI](https://www.ssa.gov/accessibility/andi/help/install.html#install) (this is the one used by gov (DHS Trusted Testers). For storybook-only components, use the accessibility tab in Storybook.

## After completion of each epic:

Test with screen reader NVDA or JAWS on Windows machine using (Chrome or Firefox)

Test responsiveness when zoomed in at 200%

Test using an Android and an iPhone
