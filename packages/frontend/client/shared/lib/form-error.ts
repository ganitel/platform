import {
  ApiError,
  extractErrorCode,
  extractFieldErrors,
} from "@/shared/api/client";
import type { TranslationKey } from "@/shared/lib/i18n";

export interface FormErrorTranslated {
  fieldErrors: Record<string, string>;
  message: string;
  detail: string;
}

interface Config {
  fieldKeys: Record<string, TranslationKey>;
  codeKeys?: Record<string, TranslationKey>;
  generic: TranslationKey;
  network?: TranslationKey;
}

export function translateFormError(
  error: unknown,
  t: (key: TranslationKey) => string,
  { fieldKeys, codeKeys, generic, network }: Config,
): FormErrorTranslated {
  const result: FormErrorTranslated = {
    fieldErrors: {},
    message: "",
    detail: "",
  };

  const fieldErrs = extractFieldErrors(error);
  if (fieldErrs && fieldErrs.length > 0) {
    for (const { field, type, msg } of fieldErrs) {
      const key =
        fieldKeys[`${field}.${type}`] ?? fieldKeys[`${field}.missing`];
      result.fieldErrors[field] = key ? t(key) : `${field}: ${msg}`;
    }
    return result;
  }

  if (error instanceof ApiError) {
    if (error.status === 0) {
      result.message = network ? t(network) : t(generic);
      result.detail = error.message;
      return result;
    }
    const code = extractErrorCode(error);
    const codeKey = code && codeKeys ? codeKeys[code] : undefined;
    result.message = codeKey ? t(codeKey) : error.message || t(generic);
    result.detail = code ? `${error.status} · ${code}` : `${error.status}`;
    return result;
  }

  result.message = t(generic);
  result.detail = error instanceof Error ? error.message : String(error);
  return result;
}
