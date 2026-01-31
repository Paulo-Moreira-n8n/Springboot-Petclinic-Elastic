// ------------------------------------ ROUTER ------------------------------------
// Tipo mínimo para manter compatibilidade de build até migrarmos tudo para hooks do RRv7.
export interface IRouter {
  push: (path: string) => void;
  replace?: (path: string) => void;
  goBack?: () => void;
}

export interface IRouterContext {
  router: IRouter;
}

// ------------------------------------ UTIL --------------------------------------
export type IHttpMethod = 'POST' | 'PUT' | 'GET' | 'PATCH' | 'DELETE';

// ------------------------------------ ERROR ------------------------------------
export interface IFieldError {
  field: string;
  message: string;
}

interface IFieldErrors {
  [index: string]: IFieldError;
}

export interface IError {
  fieldErrors: IFieldErrors;
}

// ------------------------------------ FORM --------------------------------------
export interface IConstraint {
  message: string;
  validate: (value: any) => boolean;
}

export type IInputChangeHandler = (name: string, value: string, error: IFieldError) => void;
export type IInputBlurHandler   = (name: string, value: string) => void;
export type IInputFetchHandler  = (value: string, onSuccess: (data: any) => void) => void;
export type IInputValueHandler  = (value: string) => void;

export interface ISelectOption {
  value: string | number;
  name: string;
}

// ------------------------------------ MODEL ------------------------------------
interface IBaseEntity {
  id: number;
  isNew?: boolean;
}

interface INamedEntity extends IBaseEntity {
  name: string;
}

interface IPerson extends IBaseEntity {
  firstName: string;
  lastName: string;
}

export interface IVisit extends IBaseEntity {
  date: Date;
  description: string;
}

export interface IPetType extends INamedEntity {}

export type IPetTypeId = number;

export interface IPet extends INamedEntity {
  birthDate: Date;
  type: IPetType;
  visits: IVisit[];
}

// TODO
export interface IEditablePet extends INamedEntity {
  birthDate?: string;
  type: IPetType;
  type_id?: number;
  visits: IVisit[];
  name: string;
  owner: IOwner;
}

export interface IPetTypeRequest {
  id: number;
}

export interface IPetRequest {
  id?: number;
  name: string;
  birthDate?: string;
  type: IPetTypeRequest;
  visits: IVisit[];
  owner: IOwner;
}

export interface IOwner extends IPerson {
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  telephone: string;
  pets: IPet[];
}

export interface ISpecialty extends INamedEntity {}

export interface IVet extends IPerson {
  specialties: ISpecialty[];
}
