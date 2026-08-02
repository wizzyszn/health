import BtnSpinner from "@/shared/components/btn-spinner.component";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneralReturnInt, RejectedPayload } from "@/lib/types";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import React, {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { investigateConsultation } from "@/config/service/doctor.service";
type Props = {
  consultationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setOpenModal: React.Dispatch<SetStateAction<boolean>>;
};

function Investigate({
  consultationId,
  open,
  onOpenChange,
  setOpenModal,
}: Props) {
  const [inputValue, setInputValue] = useState<string>("");
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const { mutate, isPending } = useMutation<
    GeneralReturnInt<{ message: string }>,
    RejectedPayload,
    {
      name: string[];
    }
  >({
    mutationFn: async (variables) =>
      await investigateConsultation(consultationId as string, variables),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["investigation_doc"] });
      onClose();
    },
    onError: (res) => {
      toast.error(res.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["investigation_doc"] });
    },
  });
  const onClose = () => {
    setOpenModal(false);
  };
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      setTags((tag) => [...tag, inputValue]);
      setInputValue("");
      inputRef.current?.focus();
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(e);
    }
  };
  const handleRemoveTag = useCallback(
    (selectedTag: string) => {
      const tempTags = tags.filter((tag) => tag !== selectedTag);
      if (selectedTag) setTags(tempTags);
    },
    [tags],
  );
  const handleOnchangeInputValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
    [],
  );
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate({
      name: tags,
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>Investigate this consultation</DialogHeader>
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className=" flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <div className=" w-full h-fit flex items-center gap-3 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex justify-center items-center gap-2 p-2 bg-gray-200 text-black rounded-xl text-sm"
              >
                <span>{tag}</span>
                <X
                  size={18}
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </span>
            ))}
          </div>
          <Input
            className=" space-y-4"
            ref={inputRef}
            type="text"
            placeholder="Enter values. Press Enter or , to add"
            value={inputValue}
            onChange={handleOnchangeInputValue}
            onKeyDown={handleKeyDown}
          />
          <Button type="submit" className="bg-[#2563eb]" disabled={isPending}>
            {isPending ? <BtnSpinner /> : "Submit"}
          </Button>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}

export default Investigate;
