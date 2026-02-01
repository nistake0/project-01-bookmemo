import React from 'react';
import { render, screen } from '@testing-library/react';
import LinkifiedText from './LinkifiedText';

describe('LinkifiedText', () => {
  it('空・null で何も表示しない', () => {
    const { container } = render(<LinkifiedText text="" />);
    expect(container.firstChild).toBeNull();
    const { container: c2 } = render(<LinkifiedText text={null} />);
    expect(c2.firstChild).toBeNull();
  });

  it('URLを含まないテキストをそのまま表示', () => {
    render(<LinkifiedText text="ただのテキスト" data-testid="linkified" />);
    expect(screen.getByTestId('linkified')).toHaveTextContent('ただのテキスト');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('URLを含むテキストでリンクを表示', () => {
    render(<LinkifiedText text="詳細は https://example.com を参照" data-testid="linkified" />);
    expect(screen.getByTestId('linkified')).toHaveTextContent('詳細は https://example.com を参照');
    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('複数URLをリンク化', () => {
    render(<LinkifiedText text="a https://a.com b https://b.com" data-testid="linkified" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://a.com');
    expect(links[1]).toHaveAttribute('href', 'https://b.com');
  });
});
