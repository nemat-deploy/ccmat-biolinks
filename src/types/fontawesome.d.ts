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
  // Ícones que você já usava
  export const faSearch: any;
  export const faTimes: any;
  export const faTrash: any;
  export const faUsers: any;
  export const faPlus: any;
  export const faRightFromBracket: any;
  export const faPenToSquare: any;

  // Ícones para o editor Tiptap básico
  export const faBold: any;
  export const faItalic: any;
  export const faStrikethrough: any;
  export const faParagraph: any;
  export const faHeading: any;
  export const faListUl: any;
  export const faListOl: any;

  // Ícones para alinhamento
  export const faAlignLeft: any;
  export const faAlignCenter: any;
  export const faAlignRight: any;
  export const faAlignJustify: any;

  // ✅ NOVOS ÍCONES: Ícones para links
  export const faLink: any;
  export const faUnlink: any;
}

