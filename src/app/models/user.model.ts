export interface UserProfile {
    // Les champs renvoyés par le backend après la connexion
    id: string | number;
    firstName: string;
    lastName: string;
    emailPhone: string;
    isVerified: boolean;
}