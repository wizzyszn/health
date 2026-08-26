import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createDoctorReq } from "@/config/service/admin.service";

const doctorSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid doctor email address" }),
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(20, { message: "First name must be less than 20 characters." }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(20, { message: "Last name must be less than 20 characters." }),
  phone_number: z
    .string()
    .optional()
    .refine((value) => !value || /^\+?\d{7,15}$/.test(value), {
      message: "Please enter a valid phone number",
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export default function AdminAddDoctorForm() {
  const [successMessage, setSuccessMessage] = useState("");

  const doctorForm = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      password: "",
    },
  });

  const handleDoctorSubmit = async (values: z.infer<typeof doctorSchema>) => {
    const payload: {
      email: string;
      first_name: string;
      last_name: string;
      password: string;
      phone_number?: string;
    } = {
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      password: values.password,
    };

    if (values.phone_number?.trim()) {
      payload.phone_number = values.phone_number.trim();
    }

    await createDoctorReq(payload);

    setSuccessMessage(
      `Doctor ${values.first_name} ${values.last_name} was added successfully.`,
    );
  };

  if (successMessage) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center">
        <p className="text-muted-foreground">{successMessage}</p>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            setSuccessMessage("");
            doctorForm.reset();
          }}
        >
          Add another doctor
        </Button>
      </div>
    );
  }

  return (
    <Form {...doctorForm}>
      <form
        onSubmit={doctorForm.handleSubmit(handleDoctorSubmit)}
        className="space-y-6"
      >
        <FormField
          control={doctorForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="doctor@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={doctorForm.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={doctorForm.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={doctorForm.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input placeholder="Optional: +2348012345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={doctorForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Secure password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit">
          Create doctor profile
        </Button>
      </form>
    </Form>
  );
}
