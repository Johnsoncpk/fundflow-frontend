import {
    VStack,
    Divider,
    HStack,
    Wrap,
    WrapItem,
    Center,
    Skeleton,
    Text
} from '@chakra-ui/react';
import { useEffect, useState, FC } from 'react';
import { Project } from 'utils/types';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from 'utils/getContract';
import { useReadContract } from 'wagmi';
import { ProjectCard } from 'components/modules';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { readContract } from '@wagmi/core'
import { wagmiConfig } from 'utils/wagmiConfig';
import { hardhat, sepolia } from 'wagmi/chains';

const Manage: FC = () => {
    const [projects, setProjects] = useState<Project[] | undefined>();
    const [backedProjects, setBackedProjects] = useState<Project[] | undefined>([]);
    const { address } = useAccount();

    const response = useReadContract({
        chainId: process.env.CHAIN === "sepolia" ? sepolia.id : hardhat.id,
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: 'getProjects'
    })


    const getBackers = async (project: Project): Promise<boolean> => {
        const rounds = await readContract(
            wagmiConfig,
            {
                chainId: process.env.CHAIN === "sepolia" ? sepolia.id : hardhat.id,
                abi: CONTRACT_ABI,
                address: CONTRACT_ADDRESS,
                functionName: 'getRounds',
                args: [BigInt(project.id)]
            }
        )
        const currentRound = rounds?.at(Number(project.currentRound));
        
        if(!currentRound){
            return false
        }

        const backers = await readContract(
            wagmiConfig,
            {
                chainId: process.env.CHAIN === "sepolia" ? sepolia.id : hardhat.id,
                abi: CONTRACT_ABI,
                address: CONTRACT_ADDRESS,
                functionName: 'getBackers',
                args: [BigInt(currentRound.id)]
            }
        )

        return backers.includes(address?.toString() as `0x${string}`);
    };

    const fetchProjects = async () => {
        const result = response.data?.map((project, index) => {
            return {
                id: index,
                ...project
            }
        })

        if(!result){
            return
        }

        const results = await Promise.all(result?.map(getBackers))

        const backedProjectsResult = result?.filter((_v, index) => results[index])

        setBackedProjects(backedProjectsResult);
        setProjects(result?.filter((project) => project.creator === address));
    };

    useEffect(() => { fetchProjects().catch(console.error); }, [response.isFetched, address]);

    return (
        <div>
            <Skeleton isLoaded={!response.isFetching}>
                <VStack spacing={4}>
                    <Text fontSize={'2xl'}>💰Projects Backed by You😎</Text> :
                    <Divider />
                    <HStack>
                        <Wrap spacing='20px'>
                            {backedProjects?.map((project, id) => (
                                <WrapItem key={id}>
                                    <Center>
                                        <ProjectCard project={project} id={project.id} />
                                    </Center>
                                </WrapItem>
                            ))}

                            {backedProjects?.length === 0 && (
                                <Center padding={4}>
                                    <Text textAlign={'center'}>
                                        No projects found.<br />
                                        <Text margin={4} fontSize='xl' as='u'>
                                            <Link href="/project/browse">Check some interesting projects!</Link>
                                        </Text>
                                    </Text>
                                </Center>
                            )}
                        </Wrap>
                    </HStack>

                    <Text fontSize={'2xl'}>🎨Project Created by You🔨</Text> :
                    <Divider />
                    <HStack>
                        <Wrap spacing='20px'>
                            {projects?.map((project, id) => (
                                <WrapItem key={id}>
                                    <Center>
                                        <ProjectCard project={project} id={project.id} />
                                    </Center>
                                </WrapItem>
                            ))}

                            {projects?.length === 0 && (
                                <Center padding={2}>
                                    <Text textAlign={'center'}>
                                        No projects found.<br />
                                        <Text margin={4} fontSize='xl' as='u'>
                                            <Link href="/project/create">Would you like to create a crowdfunding project?</Link>
                                        </Text>
                                    </Text>
                                </Center>
                            )}
                        </Wrap>
                    </HStack>
                </VStack>
            </Skeleton>
        </div>
    );
};

export { Manage };
