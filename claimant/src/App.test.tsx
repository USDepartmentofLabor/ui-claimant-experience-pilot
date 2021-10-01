import { render, screen } from '@testing-library/react';
import App from './App';

test('renders whoami link', () => {
  render(<App />);
  const linkElement = screen.getByText(/Checking authorization/i);
  expect(linkElement).toBeInTheDocument();
});
