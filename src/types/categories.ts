// Define the form state type
export type FormState = {
  success?: string;
  error?: string;
};

export type ProductFormProps = {
  action: (
    prevState: undefined,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
};
