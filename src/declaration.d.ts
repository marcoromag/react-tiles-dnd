declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  import React from 'react';
  const component: React.SFC<React.SVGProps<SVGSVGElement>>;
  export default component;
}
