import { NextFunction, Request, Response } from "express";
import { error } from "../utils/response";
import { ObjectSchema } from "yup";

const validate = (schema: ObjectSchema<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    req.body = validatedData;
    next();
  } catch (err) {
    error(res, err, "Invalid user data");
  }
};

export default { validate };
