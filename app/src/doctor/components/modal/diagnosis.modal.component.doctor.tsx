import BtnSpinner from "@/shared/components/btn-spinner.component";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Diagnosis as DiagnosisInt,
  GeneralReturnInt,
  RejectedPayload,
} from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import React, { SetStateAction } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { conductDiagnosis } from "@/config/service/doctor.service";
type Props = {
  consultationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setOpenModal: React.Dispatch<SetStateAction<boolean>>;
};

const diagnosisSchema = z.object({
  title: z
    .string()
    .min(5, { message: "A title for this diagnosis is required" }),
  description: z
    .string()
    .min(2, { message: "You must add a description of the diagnosis" }),
});

type DiagnosisFormValues = z.infer<typeof diagnosisSchema>;

function DiagnosisBase({
  consultationId,
  open,
  onOpenChange,
  setOpenModal,
}: Props) {
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation<
    GeneralReturnInt<DiagnosisInt>,
    RejectedPayload,
    {
      title: string;
      description: string;
    }
  >({
    mutationFn: (variables) =>
      conductDiagnosis(consultationId as string, variables),

    onError: (error) => {
      toast.success(error.message);
    },
    onSuccess: (res) => {
      toast.success(res.response_description);
      queryClient.invalidateQueries({ queryKey: ["diagnosis_doc"] });
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnosis_doc"] });
    },
  });
  const onClose = () => {
    setOpenModal(false);
  };
  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = (data: DiagnosisFormValues) => {
    mutate(data);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run diagnosis for this Consultation</DialogTitle>
          <Form {...form}>
            <motion.form
              onSubmit={form.handleSubmit(onSubmit)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full h-full flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a title for this diagnosis"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the diagnosis"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="bg-[#2563eb]"
                  disabled={isPending}
                >
                  {isPending ? <BtnSpinner /> : "Submit Diagnosis"}
                </Button>
              </div>
            </motion.form>
          </Form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
const Diagnosis = React.memo(DiagnosisBase);

export default Diagnosis;
