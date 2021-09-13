import { render, screen } from '@testing-library/react';
import App from './App';

test('renders whoami link', () => {
  render(<App />);
  const linkElement = screen.getByText(/who am i/i);
  expect(linkElement).toBeInTheDocument();
});
