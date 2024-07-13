import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { IoMdClose } from 'react-icons/io';

const PiaModal = ({ isOpen, onChange, title, description, position }) => {
    // Set default values if position is undefined
    const defaultPosition = { top: 0, left: 0 };
    const pos = position || defaultPosition;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onChange}>
            <Dialog.Portal>
                <Dialog.Content
                    style={{
                        position: 'absolute',
                        top: `${pos.top}px`,
                        left: `${pos.left}px`,
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        width: '200px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    }}
                    className="
                        fixed
                        drop-shadow-md
                        focus:outline-none
                    "
                >
                    <Dialog.Title
                        className="
                            text-md
                            text-center
                            font-bold
                            mb-2
                        ">
                        {title}
                    </Dialog.Title>
                    <Dialog.Description
                        className="
                            text-sm
                            leading-normal
                            text-center
                        ">
                        {description}
                    </Dialog.Description>
                    <Dialog.Close asChild>
                        <button
                            className="
                                text-neutral-400
                                hover:text-black
                                absolute
                                top-[5px]
                                right-[5px]
                                inline-flex
                                h-[20px]
                                w-[20px]
                                appearance-none
                                items-center
                                justify-center
                                rounded-full
                                focus:outline-none
                            "
                            aria-label="Close"
                        >
                            <IoMdClose />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default PiaModal;