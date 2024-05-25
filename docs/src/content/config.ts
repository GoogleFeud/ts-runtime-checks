import {defineCollection, z} from "astro:content";

const docs = defineCollection({
    type: "content",
    // Zod in my ts-runtime-checks???
    schema: z.object({
        title: z.string(),
        description: z.string(),
        order: z.number().int(),
    })
});

export const collections = {docs};
