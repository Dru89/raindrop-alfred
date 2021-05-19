import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import MuiLink, { LinkProps as MuiLinkProps } from '@material-ui/core/Link';
import React from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';

interface NextLinkComposedProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    Omit<NextLinkProps, 'href' | 'as'> {
  to: NextLinkProps['href'];
  linkAs?: NextLinkProps['as'];
  href?: NextLinkProps['href'];
}

export const NextLinkComposed = React.forwardRef<
  HTMLAnchorElement,
  NextLinkComposedProps
>(function NextLinkComposed(
  props: NextLinkComposedProps,
  ref: React.Ref<HTMLAnchorElement>
) {
  const {
    to,
    linkAs,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    href,
    replace,
    scroll,
    passHref,
    shallow,
    prefetch,
    locale,
    children,
    ...other
  } = props;

  return (
    <NextLink
      href={to}
      prefetch={prefetch}
      as={linkAs}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      passHref={passHref}
      locale={locale}
    >
      <a ref={ref} {...other}>
        {children}
      </a>
    </NextLink>
  );
});

export type LinkProps = {
  activeClassName?: string;
  as?: NextLinkProps['as'];
  href: NextLinkProps['href'];
  noLinkStyle?: boolean;
} & Omit<NextLinkComposedProps, 'to' | 'linkAs' | 'href'> &
  Omit<MuiLinkProps, 'href'>;

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  props: LinkProps,
  ref: React.Ref<HTMLAnchorElement>
) {
  const {
    activeClassName = 'active',
    as: linkAs,
    className: classNameProps,
    href,
    noLinkStyle,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    role, // Links don't have roles.
    children,
    ...other
  } = props;

  const router = useRouter();
  const pathname = typeof href === 'string' ? href : href.pathname;
  const className = clsx(classNameProps, {
    [activeClassName]: router.pathname === pathname && activeClassName,
  });

  const isExternal =
    typeof href === 'string' &&
    (href.startsWith('http') || href.startsWith('mailto:'));
  if (isExternal) {
    if (noLinkStyle) {
      return (
        <a
          className={className}
          href={href as string}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          ref={ref as any}
          {...other}
        >
          {children}
        </a>
      );
    }

    return (
      <MuiLink className={className} href={href as string} ref={ref} {...other}>
        {children}
      </MuiLink>
    );
  }

  if (noLinkStyle) {
    return (
      <NextLinkComposed
        className={className}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        ref={ref as any}
        to={href}
        {...other}
      >
        {children}
      </NextLinkComposed>
    );
  }

  return (
    <MuiLink
      component={NextLinkComposed}
      linkAs={linkAs}
      className={className}
      ref={ref}
      to={href}
      {...other}
    >
      {children}
    </MuiLink>
  );
});

export default Link;
