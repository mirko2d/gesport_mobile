
export type SponsorItem = {
    name: string;
    logo: any;
    url?: string; // opcional: web del sponsor
};

export const SPONSORS: SponsorItem[] = [
{
    name: 'IPF',
    logo: require('../assets/images/ipf.png'),

},
{
    name: 'Adidas',
    logo: require('../assets/images/adidas.png'),

},
{
    name: 'Powerade',
    logo: require('../assets/images/Powerade_logo.png'),
    
},
{
    name: 'Asics',
    logo: require('../assets/images/asics.png'),
},
{
    name: 'IAS',
    logo: require('../assets/images/ias.png'),
},
];
