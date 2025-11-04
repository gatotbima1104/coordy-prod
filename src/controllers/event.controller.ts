import { NextFunction, Request, Response} from "express";
import { findEventByTitle } from "../utils/event.helper";
import { Prisma } from "@prisma/client";
import { DOMAIN_NAME, prisma } from "../configs/config";
import { findEventByShortSlug, formatToSlug, shortEventSlug, shortParticipantSlug } from "../utils/link.helper";
import { EventUpdate } from "../interfaces/event.interface";
import { uuidToSlug } from "../utils/slug.helper";

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

            const existEvent = await prisma.event.findFirst({
                where: { title, userId },
            });

            if (existEvent) throw new Error("Event already exists");

            const newEvent = await prisma.event.create({
                data: {
                    title,
                    notes,
                    date,
                    status,
                    estimatedTime,
                    priority,
                    timezone,
                    availableTimes,
                    slug: `temp-${Math.random().toString(36).substring(2, 8)}`,
                    user: { connect: { id: userId } },
                },
            });

            const eventSlug = uuidToSlug(newEvent.id);
            const createdParticipants = await Promise.all(
                participants.map(async (p: any) => {
                    const name = typeof p === "string" ? p : p.name;
                    const email = typeof p === "object" && p.email ? p.email : null;

                    // Create participant to get UUID
                    const participant = await prisma.participant.create({
                        data: {
                            name,
                            email,
                            slug: `temp-${Math.random().toString(36).substring(2, 8)}`,
                            link: "temp",
                            status: "PENDING",
                            selectedTimes: [],
                            event: { connect: { id: newEvent.id } },
                        },
                    });

                    let participantSlug = uuidToSlug(participant.id);

                    const existing = await prisma.participant.findFirst({
                        where: {
                            slug: participantSlug,
                            eventId: newEvent.id,
                            NOT: { id: participant.id },
                        },
                    });

                    if (existing) participantSlug += "x";

                    const link = `${DOMAIN_NAME}/${eventSlug}/${participantSlug}`;

                    // Update slug dan link
                    return prisma.participant.update({
                        where: { id: participant.id },
                        data: { slug: participantSlug, link },
                    });
                })
            );

            // update event slug
            const updatedEvent = await prisma.event.update({
                where: { id: newEvent.id },
                data: { slug: eventSlug },
                include: { participants: true },
            });

            res.status(201).send({
                message: "success",
                data: updatedEvent,
            });
        } catch (error) {
            next(error);
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
            const userId = req.user?.id;
            const { id } = req.params;
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

            const existEvent = await prisma.event.findUnique({
                where: { id, userId },
                include: { participants: true },
            });

            if (!existEvent) throw new Error(`Event with ID: ${id} not found`);

            const updatedData: any = {};
            if (title) updatedData.title = title;
            if (notes) updatedData.notes = notes;
            if (date) updatedData.date = date;
            if (status) updatedData.status = status;
            if (estimatedTime) updatedData.estimatedTime = estimatedTime;
            if (priority) updatedData.priority = priority;
            if (timezone) updatedData.timezone = timezone;
            if (availableTimes) updatedData.availableTimes = availableTimes;

            const eventSlug = existEvent.slug || uuidToSlug(existEvent.id);
            if (participants && participants.length > 0) {
                for (const p of participants) {
                    const name = typeof p === "string" ? p : p.name;
                    if (!name) throw new Error("Each participant must have a name");

                    const participantExist = existEvent.participants.find(
                        (part) => part.name.toLowerCase().trim() === name.toLowerCase().trim()
                    );

                    if (participantExist) {
                        await prisma.participant.update({
                            where: { id: participantExist.id },
                            data: {
                                selectedTimes: p.selectedTimes ?? participantExist.selectedTimes,
                                status: p.status ?? participantExist.status,
                                email: p.email ?? participantExist.email,
                            },
                        });
                    } else {
                        const newParticipant = await prisma.participant.create({
                            data: {
                                name,
                                slug: `temp-${Math.random().toString(36).substring(2, 8)}`,
                                link: "temp",
                                status: p.status ?? "PENDING",
                                selectedTimes: p.selectedTimes ?? [],
                                event: { connect: { id: existEvent.id } },
                            },
                        });

                        // Generate UUID-based slug
                        let participantSlug = uuidToSlug(newParticipant.id);

                        // Optional safety: check slug collision inside same event
                        const existing = await prisma.participant.findFirst({
                            where: {
                                slug: participantSlug,
                                eventId: existEvent.id,
                                NOT: { id: newParticipant.id },
                            },
                        });
                        if (existing) participantSlug += "x"; // fallback uniqueness

                        // Generate link using event slug
                        const link = `${DOMAIN_NAME}/${eventSlug}/${participantSlug}`;

                        await prisma.participant.update({
                            where: { id: newParticipant.id },
                            data: { slug: participantSlug, link },
                        });
                    }
                }
            }

            const updatedEvent = await prisma.event.update({
                where: { id },
                data: updatedData,
                include: { participants: true },
            });

            res.status(200).send({
                message: "success",
                data: updatedEvent,
            });
        } catch (error) {
            next(error);
        }
    }

    async getEventBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            let event = await prisma.event.findUnique({ where: { slug }, include: { participants: true} });

            if (!event) {
                event = await findEventByShortSlug(slug);
            }
            
            if (!event) throw new Error(`Event with slug: ${slug} not found`);
            res.status(200).send({
                message: "success",
                data: event
            })
            
        } catch (error) {
            next(error)
        }
    }

    async pickTime(req: Request, res: Response, next: NextFunction) {
        try {
            
            const userId = req.user?.id;
            const { selectedTime } = req.body;
            const { eventId } = req.params;

            if (!userId) throw new Error("Unauthorized");

            const event = await prisma.event.findUnique({
                where: { id: eventId }
            })
            if (!event) throw new Error("Event not found");

            const updatedEvent = await prisma.event.update({
                where: { id: eventId },
                data: {
                    selectedTime,
                    status: "COMPLETED"
                }
            })

            res.status(200).send({ 
                message: "success", 
                data: updatedEvent 
            })

        } catch (error) {
            next(error)
        }
    }
}