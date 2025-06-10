import { render, screen } from '@testing-library/react';
import App from './App';

test('renders JPStore heading', () => {
  render(<App />);
  const linkElement = screen.getByText(/JPStore/i);
  expect(linkElement).toBeInTheDocument();
}); 