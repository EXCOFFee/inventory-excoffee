/**
 * Tests unitarios para el componente Input.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows helper text when provided', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(<Input helperText="Helper" error="Error" />);
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('handles input change', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('renders with left icon', () => {
    render(<Input leftIcon={<span data-testid="left-icon">📧</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Input rightIcon={<span data-testid="right-icon">👁️</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });

  it('applies different variants', () => {
    const { rerender } = render(<Input variant="default" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('bg-dark-800/50');

    rerender(<Input variant="filled" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('bg-dark-900/80');
  });
});
