import { NextFunction, Request, Response} from "express";
import { findEventByTitle } from "../utils/event.helper";
import { Prisma } from "@prisma/client";
import { DOMAIN_NAME, prisma } from "../configs/config";
import { formatToSlug } from "../utils/link.helper";
import { EventUpdate } from "../interfaces/event.interface";

export class EventController {
    async createEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                title,
                notes,
                date,
                status,
                estimatedTime,
                priority,
                timezone,
                availableTimes,
                participants,
            } = req.body;

            const userId = req.user?.id;
            const existEvent = await findEventByTitle(title)
            if (existEvent) throw new Error("Event already exist")

            const data: any = {
                title,
                availableTimes,
                date,
                estimatedTime,
                status,
                timezone,
                notes,
                priority,
                slug: formatToSlug(title),
                user: {
                    connect: {
                        id: userId
                    }
                },
                participants: {
                    create: participants.map((p: any) => {
                    const participantName = typeof p === "string" ? p : p.name;
                    const participantEmail =
                        typeof p === "object" && p.email ? p.email : null;

                    return {
                        name: participantName,
                        email: participantEmail,
                        link: `${DOMAIN_NAME}?event=${formatToSlug(title)}&participant=${formatToSlug(participantName)}`,
                        status: "PENDING",
                        selectedTimes: [],
                    };
                    }),
                },
            }

            const newEvent = await prisma.event.create({
                data,
                include: {
                    user: {
                        select: {
                            email: true,
                        }
                    },
                    participants: {
                        select: {
                            name: true,
                            email: true,
                            link: true
                        }
                    }
                }
            })

            res.status(201).send({
                message: "success",
                data: newEvent
            })

        } catch (error) {
            next(error)
        }
    }

    async getEvents(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { name, year, month, day, status } = req.query;

            let dateFilter: any = {};

            if (year && month && day) {
                const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
                const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
                dateFilter.createdAt = { gte: startDate, lte: endDate };
            } else if (year && month) {
                const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
                const endDate = new Date(`${year}-${month}-31T23:59:59.999Z`);
                dateFilter.createdAt = { gte: startDate, lte: endDate };
            } else if (year) {
                const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
                const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
                dateFilter.createdAt = { gte: startDate, lte: endDate };
            }

            let filter: any = {
                userId,
                ...dateFilter,
            };
        
            if (name) {
                filter.name = { contains: String(name), mode: 'insensitive' };
            }

            if (status) {
                const validStatuses = ["WAITING_RESPONSE", "NEED_ACTION", "COMPLETED"];
                const normalized = String(status).toUpperCase();
                if (!validStatuses.includes(normalized)) {
                    return res.status(400).json({ message: "Invalid status value." });
                }
                filter.status = normalized;
            }

            const data = await prisma.event.findMany({
                include: {
                    user: {
                        select : {
                            id: true,
                            email: true
                        }   
                    },
                    participants: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            status: true,
                            selectedTimes: true,
                            link: true
                        }
                    }
                },
                where: filter,
                orderBy: { createdAt: "desc" },
            })

            res.status(200).send({
                message: "success",
                data
            })

        } catch (error) {
            next(error)
        }
    }
    
    async getEventById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user?.id

            const existEvent = await prisma.event.findUnique({
                where: {
                    id,
                    userId
                },
                include: {
                    participants: true
                }
            })

            if (!existEvent) throw new Error(`Event with ID: ${id} not found`)
            res.status(200).send({
                message: "success",
                data: existEvent
            })
        } catch (error) {
            next(error)
        }
    }

    async deteleEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user?.id
            const eventExist = await prisma.event.findUnique({
                where: {
                    id,
                    userId,
                },
            })
            if(!eventExist) throw new Error(`Event with ID ${id} already deleted`)
            await prisma.event.delete({
                where: {
                    id
                }
            })

            res.status(200).send({
                message: "Event has been deleted successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    async editEventById(req: Request, res: Response, next: NextFunction) {
        try {
            
            const userId = req.user?.id
            const { id } = req.params
            const {
                title,
                notes,
                date,
                status,
                estimatedTime,
                priority,
                timezone,
                availableTimes,
                participants,
            } = req.body

            const existEvent = await prisma.event.findUnique({
                where: {
                    id,
                    userId
                }
            })

            if(!existEvent) throw new Error(`Event with ID: ${id} not found`)
            const updatedData: EventUpdate = {}

            if (title) updatedData.title = title;
            if (notes) updatedData.notes = notes;
            if (date) updatedData.date = date;
            if (status) updatedData.status = status;
            if (estimatedTime) updatedData.estimatedTime = estimatedTime;
            if (priority) updatedData.priority = priority;
            if (timezone) updatedData.timezone = timezone;
            if (availableTimes) updatedData.availableTimes = availableTimes;
            if (participants) updatedData.participants = participants;

            const updatedEvent = await prisma.event.update({
                where: { id },
                data: {
                    ...updatedData,
                    participants: participants
                    ? {
                        deleteMany: {}, // Clear previous participants
                        create: participants.map((p: any) => {
                            const name = typeof p === "string" ? p : p.name;
                            const email = typeof p === "string" ? null : p.email ?? null;

                            if (!name) {
                            throw new Error("Each participant must have a name");
                            }

                            return {
                            name,
                            email,
                            link: `${DOMAIN_NAME}${formatToSlug(title || existEvent.title)}/${formatToSlug(name)}`,
                            status: "PENDING",
                            selectedTimes: [],
                            };
                        }),
                        }
                    : undefined,
                },
                include: { participants: true },
            });

            res.status(200).send({
                message: "success",
                data: updatedEvent
            })

        } catch (error) {
            next(error)
        }
    }

    async getEventBySlug(req: Request, res: Response, next: NextFunction) {
        try {

            const { slug } = req.params
            const event = await prisma.event.findUnique({
                where: {
                    slug
                }
            })

            if(!event) throw new Error(`Event with slug:${slug} not found`)

            res.status(200).send({
                message: "success",
                data: event
            })
            
        } catch (error) {
            next(error)
        }
    }
}