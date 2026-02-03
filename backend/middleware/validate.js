const { z } = require('zod');

// Schéma pour l'inscription
const registerSchema = z.object({
    shopName: z.string().min(2, "Le nom du magasin doit avoir au moins 2 caractères"),
    email: z.string().email("Format d'email invalide").refine((val) => val.endsWith('@gmail.com'), {
        message: "Seuls les comptes Gmail (@gmail.com) sont autorisés.",
    }),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")
        .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Le mot de passe doit contenir des lettres et des chiffres"),
    phone: z.string().min(7, "Numéro trop court").max(10, "Numéro trop long"),
    address: z.string().min(2, "L'adresse est requise"),
    footerMessage: z.string().min(2, "Le message de pied de page est requis"),
});

// Schéma pour la connexion
const loginSchema = z.object({
    email: z.string().email("Format d'email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

// Middleware de validation générique
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            // On ne renvoie que le premier message d'erreur pour rester simple
            const message = err.errors?.[0]?.message || "Erreur de validation";
            return res.status(400).json({ msg: message });
        }
        next(err);
    }
};

module.exports = { registerSchema, loginSchema, validate };
