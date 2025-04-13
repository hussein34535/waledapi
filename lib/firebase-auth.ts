import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const signIn = async (email: string, password: string) => {
  console.log("Attempting to sign in with:", email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    let errorMessage = "Failed to sign in";

    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Invalid email address";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many failed attempts. Please try again later";
        break;
      default:
        errorMessage = error.message || "An error occurred during sign in";
    }

    throw new Error(errorMessage);
  }
};