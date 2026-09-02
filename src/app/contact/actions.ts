"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
export type ContactState={success?:boolean;error?:string};
const schema=z.object({name:z.string().trim().min(2).max(80),email:z.string().email(),phone:z.string().trim().max(30).optional(),message:z.string().trim().min(10).max(3000)});
export async function submitContact(_:ContactState,formData:FormData):Promise<ContactState>{const parsed=schema.safeParse(Object.fromEntries(formData));if(!parsed.success)return{error:"Please complete all required fields correctly."};await prisma.contactMessage.create({data:parsed.data});return{success:true}}
