import React from 'react';
import { ProdigyLogo, ProdigyLogoProps } from './ProdigyLogo';

export type NptrLogoProps = ProdigyLogoProps;
export const NptrLogo: React.FC<NptrLogoProps> = (props) => {
  return <ProdigyLogo {...props} />;
};

export default NptrLogo;
