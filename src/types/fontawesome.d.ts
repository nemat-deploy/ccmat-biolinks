// fontawesome.d.ts
declare module '@fortawesome/react-fontawesome' {
  import { ReactElement, SVGAttributes } from 'react';
  const FontAwesomeIcon: (props: SVGAttributes<SVGElement> & {
    icon: any;
    size?: 'xs' | 'sm' | 'lg' | 'xl' | '2x' | '3x';
    spin?: boolean;
  }) => ReactElement;
}

declare module '@fortawesome/free-solid-svg-icons' {
  export const faSearch: any;
  export const faTimes: any;
  export const faEdit: any;
  export const faTrash: any;
}