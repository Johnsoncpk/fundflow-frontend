import {
    Flex,
    Text,
    Heading,
    Grid,
    GridItem,
    Image,
    Box,
    Stat,
    StatGroup,
    StatLabel,
    StatNumber,
    Progress,
    Button,
    IconButton,
    Link,
    useToast,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    FormControl,
    FormHelperText,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Tooltip
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { InfoOutlineIcon, StarIcon } from '@chakra-ui/icons';
import { ProjectMetaData, ProjectProps } from 'components/types';
import { ethers, utils } from 'ethers';
import { useRouter } from 'next/router';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from 'utils/getContract';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { formatDateToString } from 'utils/format';

const Basic: React.FC<ProjectProps> = ({ project, rounds, backers }) => {
    const toast = useToast()
    const router = useRouter()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [option, setOption] = useState<string>('package1');
    const [amount, setAmount] = useState<string>(getAmount(100));

    const {
        data: hash,
        isPending,
        writeContractAsync
    } = useWriteContract()

    const { open } = useWeb3Modal()
    const { address } = useAccount()

    // status checkign should do in server side
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    function getDayBefore(date: Date): React.ReactNode {
        const today = new Date();
        const Difference_In_Time = date.getTime() - today.getTime();
        const Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24));

        return Difference_In_Days;
    }

    useEffect(() => {
        if (isConfirmed) {
            toast({
                title: `Create Project Transaction Confirmed!`,
                description:
                    (<Text>
                        Transaction Completed! Thank you!
                        <Text as={'u'}>
                            <br />
                            <Link href={`https://sepolia.etherscan.io/tx/${hash}`}> Check the  Transaction status here!</Link>
                        </Text>
                    </Text>),
                status: "success",
                position: 'top',
                isClosable: true,
            })
        }
    }, [isConfirmed])

    useEffect(() => {
        if (isConfirming) {
            toast({
                title: `Transaction Created! Please Wait...`,
                description:
                    (<Text as="u">
                        <Link href={`https://sepolia.etherscan.io/tx/${hash}`}> Check the  Transaction status here!</Link>
                    </Text>),
                status: "info",
                position: 'top',
                isClosable: true,
            })
        }
    }, [isConfirming])

    async function onBackProjectClick() {
        try {
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'fundProject',
                args: [BigInt(router.query.id as string)],
                value: utils.parseEther(amount).toBigInt()
            })
        } catch (error: any) {
            toast({
                title: `Error: ${error.name}`,
                description: error.shortMessage,
                position: "top",
                status: "error",
                isClosable: true,
            })

            if (error.name === "ConnectorNotConnectedError") {
                onClose();
                open({ view: 'Connect' })
            }
        }
    }

    function getAmount(div: number): string {
        return utils.formatEther(BigInt(project.totalFundingGoal) / BigInt(div))
    }

    function getActionButton(): React.ReactNode {
        console.log(address, project.creator)
        if (project.creator === address) {
            return (
                <Button colorScheme='teal' disabled={isPending}>
                    <Link colorScheme='teal' href={`/project/update/${router.query.id as string}`}>
                        Manage the project
                    </Link>
                </Button>
            )
        }

        return (
            <Button colorScheme='teal' disabled={isPending} onClick={onOpen} >
                Back this project
            </Button>
        )
    }

    return (
        <div>
            <Grid
                templateAreas={`
                  "title title"
                  "image description"
                  "image progressBar"
                  "image amountFunded"
                  "image amountBacker"
                  "image dealineTimer"
                  "image control"
                  "image reminder"`}
                gridTemplateRows={'0.1fr 0.15fr 0.25fr 0.1fr 0.1fr 0.1fr 0.1fr 0.1fr'}
                gridTemplateColumns={'0.6fr 0.4fr'}
                gap='1'
                pb={4} marginBottom={'10px'}
            >
                <GridItem pl='2' area={'image'}>
                    <Box
                        display={'block'}
                        position={'relative'}
                        height={'100%'}
                        borderRadius="xl">
                        <Image
                            src={project.metadata?.image}
                            alt={'project cover image'}
                            maxHeight="100%"
                            maxWidth="100%"
                            margin={'0 auto'}
                            width={'auto'}
                            display={'block'}
                            borderRadius={'base'}
                        />
                    </Box>
                </GridItem>
                <GridItem pl='2' area={'title'}>
                    <Heading>
                        {project?.name}
                        <IconButton
                            mx={"10px"}
                            colorScheme={'teal'}
                            variant='outline'
                            aria-label='Bookmark this project'
                            fontSize='20px'
                            icon={<StarIcon />}
                        />
                    </Heading>
                </GridItem>
                <Tooltip hasArrow label={project?.metadata?.description} padding={'10px'}>
                    <GridItem pl='2' area={'description'}>
                        <Text noOfLines={[1, 2, 3]}>{(project?.metadata as ProjectMetaData)?.description}</Text>
                    </GridItem>
                </Tooltip>
                <GridItem pl='2' area={'progressBar'}>
                    <Progress colorScheme={'teal'} value={Number(rounds[Number(project.currentRound)].collectedFund / rounds[Number(project.currentRound)].fundingGoal) * 100} />
                </GridItem>
                <GridItem pl='2' area={'amountFunded'}>
                    <StatGroup>
                        <Stat>
                            <StatNumber textColor={'teal.400'} >{Number(ethers.utils.formatEther(rounds[Number(project.currentRound)].collectedFund)).toFixed(3)} ETH</StatNumber>
                            <Tooltip label={<Text>It will should the funding information of the current round of the project only.<br /> if you want to see more rounds, please check the <Text as={'u'}>Round Status</Text> section below.</Text>} >
                                <StatLabel>pledged of {ethers.utils.formatEther(rounds[Number(project.currentRound)].fundingGoal)} ETH goal ( Round <Text as={'u'}> {Number(project.currentRound) + 1}</Text> ) <InfoOutlineIcon /> </StatLabel>
                            </Tooltip>
                        </Stat>
                    </StatGroup>
                </GridItem>
                <GridItem pl='2' area={'amountBacker'}>
                    <StatGroup>
                        <Stat>
                            <StatNumber textColor={'teal.400'}>{backers.length}</StatNumber>
                            <StatLabel>backer</StatLabel>
                        </Stat>
                    </StatGroup>
                </GridItem>
                <GridItem pl='2' area={'dealineTimer'}>
                    <StatGroup>
                        <Stat>
                            <StatNumber textColor={'teal.400'}>{getDayBefore(new Date(Number(rounds[Number(project.currentRound)].endAt) * 1000))}</StatNumber>
                            <StatLabel>days to go</StatLabel>
                        </Stat>
                    </StatGroup>
                </GridItem>
                <GridItem pl='2' area={'control'}>
                    <Flex justify="flex-end" flexDir="column" width="100%">
                        {getActionButton()}
                    </Flex>
                </GridItem>
                <GridItem pl='2' area={'reminder'}>
                    <Flex justify="flex-end" flexDir="column" width="100%">
                        <Text variant={'ghost'} noOfLines={[1, 2]}>All or nothing. This project will only be funded if it reaches its goal by {formatDateToString(rounds[Number(project.currentRound)].endAt)}</Text>
                    </Flex>
                </GridItem>
            </Grid>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>What package do you want to support?</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl as='fieldset'>
                            <RadioGroup
                                defaultValue={'package1'}
                                m={'2'}
                                alignItems={'left'}
                                value={option}
                                onChange={(value: string) => {
                                    setOption(value)
                                    switch (value) {
                                        case 'package1':
                                            setAmount(getAmount(100))
                                            break;
                                        case 'package2':
                                            setAmount(getAmount(50))
                                            break;
                                        case 'custom':
                                            setAmount(amount)
                                            break;
                                    }
                                }}>
                                <Radio value='package1' my={'2'}>
                                    Package 1 (<Text as={'u'}>{getAmount(100)} ETH</Text>) : <Text as={'b'}>Product x 1 + Souvenir</Text>
                                </Radio>
                                <Radio value={'package2'} my={'2'}>
                                    Package 2 (<Text as={'u'}>{getAmount(50)} ETH</Text>) : <Text as={'b'}>Product x 2 + Souvenir</Text>
                                </Radio>
                                <Radio value='custom' my={'2'}>
                                    Package 3 (<Text as={'u'}>Custom</Text>) : <Text as={'b'}>Product x 2 + Souvenir</Text>
                                </Radio>
                                <NumberInput size={'sm'} maxW={32}
                                    onChange={(value: string) => {
                                        setAmount(value)
                                    }} value={amount} min={Number(getAmount(50))}>
                                    <NumberInputField disabled={option !== 'custom'} />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </RadioGroup>
                            <FormHelperText>Different Package have different reward!</FormHelperText>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='teal' disabled={isPending} onClick={onBackProjectClick} >
                            Back this project
                        </Button>
                        <Button ml={'2'} onClick={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div >
    )
}

export { Basic }