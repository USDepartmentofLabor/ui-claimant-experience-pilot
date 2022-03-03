import { RefObject, useEffect } from "react";

export const useFocusFirstError = (
  error: string | undefined,
  inputRef:
    | RefObject<HTMLInputElement>
    | RefObject<HTMLSelectElement>
    | RefObject<HTMLTextAreaElement>
) =>
  useEffect(() => {
    inputRef.current?.setCustomValidity(error || "");
  }, [error, inputRef.current]);

// Workaround for not being given a ref to hook in to
export const useFocusFirstErrorById = (
  error: string | undefined,
  inputElementId: string
) =>
  useEffect(() => {
    const input = document.getElementById(inputElementId);
    if (input instanceof HTMLInputElement) {
      input.setCustomValidity(error || "");
    }
  }, [error, inputElementId]);
